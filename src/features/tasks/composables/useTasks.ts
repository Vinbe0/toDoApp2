import { computed, h, onMounted, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import type { Label, Task } from "@/features/tasks/model/types";
import { useAuth } from "@/features/auth/composables/useAuth";
import {
  applyReorder,
  countTasks,
  createDefaultQuery,
  queryTasks,
  type TaskQuery,
} from "@/features/tasks/model/query";
import {
  apiTaskRepository,
  localTaskRepository,
  type NewTask,
  type TaskRepository,
} from "@/features/tasks/repositories";
import { HttpError, getErrorMessage } from "@/shared/api";

const { isRegistered, logout } = useAuth();

const UNDO_TIMEOUT_MS = 5000;

type EditingState = {
  id: string | null;
  value: string;
};

const createDraftTask = (): NewTask => ({
  text: "",
  description: "",
  deadline: null,
  priority: "medium",
  labels: [],
});

export function useTasks() {
  const toast = useToast();

  const tasks = ref<Task[]>([]);
  const query = ref<TaskQuery>(createDefaultQuery());
  const draftTask = ref<NewTask>(createDraftTask());
  const editing = ref<EditingState>({ id: null, value: "" });

  const repository = computed<TaskRepository>(() =>
    isRegistered.value ? apiTaskRepository : localTaskRepository,
  );

  function handleError(error: unknown, fallback: string) {
    if (error instanceof HttpError && error.isUnauthorized) {
      logout();
      toast.error("Your session has expired. Please log in again.");
      return;
    }
    toast.error(getErrorMessage(error, fallback));
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
      handleError(error, errorMessage);
    }
  }

  async function reloadTasks() {
    try {
      tasks.value = await repository.value.list();
    } catch (error) {
      handleError(error, "Could not load your tasks");
    }
  }

  async function importGuestTasks() {
    const guestTasks = await localTaskRepository.list();
    if (!guestTasks.length) return;
    if (!window.confirm(`Import ${guestTasks.length} task(s) from guest mode into your account?`)) {
      return;
    }

    for (const task of guestTasks) {
      await apiTaskRepository.create(task);
    }
    localTaskRepository.clear();
  }

  const filteredTasks = computed(() => queryTasks(tasks.value, query.value));
  const counts = computed(() => countTasks(tasks.value));

  const draggableTasks = computed({
    get: () => filteredTasks.value,
    set(reordered: Task[]) {
      tasks.value = applyReorder(tasks.value, reordered);
      void repository.value.reorder(tasks.value.map((task) => task.id));
    },
  });

  onMounted(() => void reloadTasks());
  watch(isRegistered, () => void reloadTasks());

  const addNewTask = async () => {
    const text = draftTask.value.text.trim();
    if (!text) return;

    try {
      const created = await repository.value.create({
        ...draftTask.value,
        text,
        labels: [...draftTask.value.labels],
      });
      tasks.value.push(created);
      draftTask.value = createDraftTask();
    } catch (error) {
      handleError(error, "Could not create the task");
    }
  };

  const deleteTask = async (taskId: string) => {
    const index = tasks.value.findIndex((task) => task.id === taskId);
    const task = tasks.value[index];
    if (!task) return;

    await optimistic(
      () => tasks.value.splice(index, 1),
      () => tasks.value.splice(index, 0, task),
      () => repository.value.remove(taskId),
      "Could not delete the task",
    );
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;
    const completed = !task.completed;

    await optimistic(
      () => (task.completed = completed),
      () => (task.completed = !completed),
      () => repository.value.update(taskId, { completed }),
      "Could not update the task",
    );
  };

  const startEdit = (task: Task) => {
    editing.value = { id: task.id, value: task.text };
  };

  const cancelEdit = () => {
    editing.value = { id: null, value: "" };
  };

  const saveEdit = async () => {
    const { id, value } = editing.value;
    const task = tasks.value.find((item) => item.id === id);
    cancelEdit();
    if (!task) return;

    const previousText = task.text;
    const text = value.trim();
    if (!text || text === previousText) return;

    await optimistic(
      () => (task.text = text),
      () => (task.text = previousText),
      () => repository.value.update(task.id, { text }),
      "Could not rename the task",
    );
  };

  const clearCompleted = () => {
    const completedTasks = tasks.value.filter((task) => task.completed);
    if (!completedTasks.length) {
      toast.info("No completed tasks to clear");
      return;
    }

    const previousTasks = tasks.value.slice();
    const repo = repository.value;
    tasks.value = tasks.value.filter((task) => !task.completed);

    // Delay the actual delete so "Undo" can cancel it.
    const commitDelete = async () => {
      const results = await Promise.allSettled(completedTasks.map((task) => repo.remove(task.id)));
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed) {
        toast.error(`Could not delete ${failed} task${failed === 1 ? "" : "s"}`);
        await reloadTasks();
      }
    };
    const deleteTimer = setTimeout(commitDelete, UNDO_TIMEOUT_MS);

    const undo = () => {
      clearTimeout(deleteTimer);
      tasks.value = previousTasks;
      toast.dismiss(toastId);
    };

    const count = completedTasks.length;
    const toastId = toast(
      h("div", { class: "flex items-center gap-3" }, [
        h("span", `Cleared ${count} completed task${count === 1 ? "" : "s"}`),
        h(
          "button",
          { class: "rounded bg-white/20 px-2 py-1 font-bold text-white", onClick: undo },
          "Undo",
        ),
      ]),
      { timeout: UNDO_TIMEOUT_MS, closeOnClick: false },
    );
  };

  const resetQuery = () => {
    query.value = { ...createDefaultQuery(), sort: query.value.sort };
  };

  const toggleDraftLabel = (label: Label) => {
    const labels = draftTask.value.labels;
    const index = labels.indexOf(label);
    if (index === -1) labels.push(label);
    else labels.splice(index, 1);
  };

  return {
    tasks,
    query,
    counts,
    draftTask,
    editing,
    filteredTasks,
    draggableTasks,
    addNewTask,
    deleteTask,
    completeTask,
    startEdit,
    saveEdit,
    cancelEdit,
    clearCompleted,
    resetQuery,
    toggleDraftLabel,
    importGuestTasks,
  };
}
