import { computed, ref, watch } from "vue";
import { defineStore, storeToRefs } from "pinia";
import type { Task } from "@/features/tasks/model/types";
import { LABELS } from "@/features/tasks/model/task";
import {
  applyReorder,
  countOpenByLabel,
  countTasks,
  createDefaultQuery,
  queryTasks,
  type TaskQuery,
} from "@/features/tasks/model/query";
import { taskRepositories, type NewTask } from "@/features/tasks/repositories";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { HttpError, getErrorMessage } from "@/shared/api";
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
  const labelCounts = computed(() => countOpenByLabel(tasks.value, LABELS));
  const canReorder = computed(() => query.value.sort === "manual");

  function reportError(error: unknown, fallback: string) {
    // A 401 has already logged the user out (see main.ts); explain why.
    if (error instanceof HttpError && error.isUnauthorized) {
      notify.error("Your session has expired. Please log in again.");
    } else {
      notify.error(getErrorMessage(error, fallback));
    }
  }

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

  /** Copies guest tasks into the account after login/sign-up. Returns how many were imported. */
  async function importGuestTasks(confirm: (count: number) => boolean) {
    const guestTasks = await taskRepositories.local.list();
    if (!guestTasks.length || !confirm(guestTasks.length)) return 0;

    for (const task of guestTasks) {
      await taskRepositories.api.create(task);
    }
    taskRepositories.local.clear();
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
    remove,
    reorder,
    clearCompleted,
    importGuestTasks,
    setQuery,
    resetQuery,
  };
});
