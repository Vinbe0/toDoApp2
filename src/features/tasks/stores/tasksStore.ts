import { computed, ref, watch } from "vue";
import { defineStore, storeToRefs } from "pinia";
import type { Task } from "@/features/tasks/model/types";
import {
  applyReorder,
  countOpenByLabel,
  countTasks,
  createDefaultQuery,
  queryTasks,
  type TaskQuery,
} from "@/features/tasks/model/query";
import { labelNameKey } from "@/features/tasks/model/label";
import { labelRepositories, taskRepositories, type NewTask } from "@/features/tasks/repositories";
import { useLabelsStore } from "@/features/tasks/stores/labelsStore";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { notify } from "@/shared/lib/notify";

export const UNDO_TIMEOUT_MS = 5000;

type LoadStatus = "idle" | "loading" | "ready" | "error";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export const useTasksStore = defineStore("tasks", () => {
  const { isRegistered } = storeToRefs(useAuthStore());

  const tasks = ref<Task[]>([]);
  const query = ref<TaskQuery>(createDefaultQuery());
  const status = ref<LoadStatus>("idle");

  const repository = computed(() =>
    isRegistered.value ? taskRepositories.api : taskRepositories.local,
  );

  const visibleTasks = computed(() => queryTasks(tasks.value, query.value));
  const counts = computed(() => countTasks(tasks.value));
  const labelsStore = useLabelsStore();
  const labelCounts = computed(() => countOpenByLabel(tasks.value, labelsStore.labels));
  const canReorder = computed(() => query.value.sort === "manual");

  const reportError = (error: unknown, fallback: string) => notify.fromError(error, fallback);

  /** Applies a change locally right away and rolls it back if the request fails. */
  async function optimistic(
    apply: () => void,
    rollback: () => void,
    request: () => Promise<unknown>,
    errorMessage: string,
  ) {
    apply();
    try {
      await request();
    } catch (error) {
      rollback();
      reportError(error, errorMessage);
    }
  }

  async function load() {
    status.value = "loading";
    try {
      tasks.value = await repository.value.list();
      status.value = "ready";
    } catch (error) {
      status.value = "error";
      reportError(error, "Could not load your tasks");
    }
  }

  // Switching between guest and account storage reloads the list.
  watch(isRegistered, () => {
    if (status.value !== "idle") void load();
  });

  async function add(input: NewTask) {
    const text = input.text.trim();
    if (!text) return false;
    try {
      tasks.value.push(await repository.value.create({ ...input, text }));
      return true;
    } catch (error) {
      reportError(error, "Could not create the task");
      return false;
    }
  }

  async function toggle(id: string) {
    const task = tasks.value.find((item) => item.id === id);
    if (!task) return;
    const completed = !task.completed;

    await optimistic(
      () => (task.completed = completed),
      () => (task.completed = !completed),
      () => repository.value.update(id, { completed }),
      "Could not update the task",
    );
  }

  async function rename(id: string, newText: string) {
    const task = tasks.value.find((item) => item.id === id);
    const text = newText.trim();
    if (!task || !text || text === task.text) return;
    const previous = task.text;

    await optimistic(
      () => (task.text = text),
      () => (task.text = previous),
      () => repository.value.update(id, { text }),
      "Could not rename the task",
    );
  }

  /** Changes a task's due date (null removes it), e.g. after dragging it to another day. */
  async function reschedule(id: string, deadline: string | null) {
    const task = tasks.value.find((item) => item.id === id);
    if (!task || (task.deadline?.slice(0, 10) ?? null) === deadline) return;
    const previous = task.deadline;

    await optimistic(
      () => (task.deadline = deadline),
      () => (task.deadline = previous),
      () => repository.value.update(id, { deadline }),
      "Could not change the date",
    );
  }

  async function remove(id: string) {
    const index = tasks.value.findIndex((task) => task.id === id);
    const task = tasks.value[index];
    if (!task) return;

    await optimistic(
      () => tasks.value.splice(index, 1),
      () => tasks.value.splice(index, 0, task),
      () => repository.value.remove(id),
      "Could not delete the task",
    );
  }

  /** Persists a drag-and-drop reorder of the currently visible tasks. */
  function reorder(reorderedVisible: Task[]) {
    tasks.value = applyReorder(tasks.value, reorderedVisible);
    void repository.value.reorder(tasks.value.map((task) => task.id)).catch((error: unknown) => {
      reportError(error, "Could not save the new order");
    });
  }

  /** Hides completed tasks now and deletes them after the undo window closes. */
  function clearCompleted() {
    const completed = tasks.value.filter((task) => task.completed);
    if (!completed.length) {
      notify.info("No completed tasks to clear");
      return;
    }

    const previous = tasks.value.slice();
    const repo = repository.value;
    tasks.value = tasks.value.filter((task) => !task.completed);

    const timer = setTimeout(async () => {
      const results = await Promise.allSettled(completed.map((task) => repo.remove(task.id)));
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed) {
        notify.error(`Could not delete ${plural(failed, "task")}`);
        await load();
      }
    }, UNDO_TIMEOUT_MS);

    notify.withAction(
      `Cleared ${plural(completed.length, "completed task")}`,
      "Undo",
      () => {
        clearTimeout(timer);
        tasks.value = previous;
      },
      UNDO_TIMEOUT_MS,
    );
  }

  /** A label was deleted: take it off every task and out of the current filter. */
  function forgetLabel(labelId: string) {
    for (const task of tasks.value) {
      task.labelIds = task.labelIds.filter((id) => id !== labelId);
    }
    if (query.value.labelIds.includes(labelId)) {
      setQuery({ labelIds: query.value.labelIds.filter((id) => id !== labelId) });
    }
  }

  /**
   * Copies guest tasks into the account after login/sign-up. Guest labels are
   * matched to the account's labels by name (created if missing). Returns how
   * many tasks were imported.
   */
  async function importGuestTasks(confirm: (count: number) => boolean) {
    const guestTasks = await taskRepositories.local.list();
    if (!guestTasks.length || !confirm(guestTasks.length)) return 0;

    const guestLabels = await labelRepositories.local.list();
    const accountLabels = await labelRepositories.api.list();
    const accountIdFor = new Map<string, string>();

    for (const guestId of new Set(guestTasks.flatMap((task) => task.labelIds))) {
      const guestLabel = guestLabels.find((label) => label.id === guestId);
      if (!guestLabel) continue;
      let match = accountLabels.find(
        (label) => labelNameKey(label.name) === labelNameKey(guestLabel.name),
      );
      if (!match) {
        match = await labelRepositories.api.create({
          name: guestLabel.name,
          color: guestLabel.color,
        });
        accountLabels.push(match);
      }
      accountIdFor.set(guestId, match.id);
    }

    for (const task of guestTasks) {
      const labelIds = task.labelIds.flatMap((id) => accountIdFor.get(id) ?? []);
      await taskRepositories.api.create({ ...task, labelIds });
    }
    taskRepositories.local.clear();
    await labelsStore.load();
    return guestTasks.length;
  }

  function setQuery(patch: Partial<TaskQuery>) {
    query.value = { ...query.value, ...patch };
  }

  function resetQuery() {
    query.value = { ...createDefaultQuery(), sort: query.value.sort };
  }

  return {
    tasks,
    query,
    status,
    visibleTasks,
    counts,
    labelCounts,
    canReorder,
    load,
    add,
    toggle,
    rename,
    reschedule,
    remove,
    reorder,
    clearCompleted,
    forgetLabel,
    importGuestTasks,
    setQuery,
    resetQuery,
  };
});
