import { computed, h, onMounted, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import type { Label, Task } from "@/features/tasks/model/types";
import { useAuth } from "@/features/auth/composables/useAuth";
import { tasksApi } from "@/features/tasks/api/tasksApi";
import { normalizeTaskList } from "@/features/tasks/model/task";
import {
  applyReorder,
  countTasks,
  createDefaultQuery,
  queryTasks,
  type TaskQuery,
} from "@/features/tasks/model/query";
import { jsonItem } from "@/shared/lib/storage";
import { HttpError, getErrorMessage } from "@/shared/api";

const guestTasksStorage = jsonItem("guest-tasks", normalizeTaskList);

const { isRegistered, logout } = useAuth();

const UNDO_TIMEOUT_MS = 5000;

type DraftTask = Pick<Task, "text" | "description" | "deadline" | "priority" | "labels">;

type EditingState = {
  id: string | null;
  value: string;
};

const createDraftTask = (): DraftTask => ({
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
  const draftTask = ref<DraftTask>(createDraftTask());
  const editing = ref<EditingState>({ id: null, value: "" });

  function handleError(error: unknown, fallback: string) {
    if (error instanceof HttpError && error.isUnauthorized) {
      logout();
      toast.error("Your session has expired. Please log in again.");
      return;
    }
    toast.error(getErrorMessage(error, fallback));
  }

  function saveGuestTasks() {
    guestTasksStorage.set(tasks.value);
  }

  async function importGuestTasks() {
    const guestTasks = guestTasksStorage.get();
    if (!guestTasks?.length) return;

    const result = window.confirm("Do you want to import your tasks?");
    if (result) {
      for (const task of guestTasks) {
        await tasksApi.createTask(task);
      }
      guestTasksStorage.remove();
    }
  }

  function loadGuestTasks() {
    tasks.value = guestTasksStorage.get() ?? [];
  }

  async function reloadTasks() {
    if (isRegistered.value) {
      try {
        tasks.value = await tasksApi.getTasks();
      } catch (error) {
        handleError(error, "Could not load your tasks");
      }
    } else {
      loadGuestTasks();
    }
  }

  const filteredTasks = computed(() => queryTasks(tasks.value, query.value));
  const counts = computed(() => countTasks(tasks.value));

  const draggableTasks = computed({
    get: () => filteredTasks.value,
    set(reordered: Task[]) {
      tasks.value = applyReorder(tasks.value, reordered);
      if (!isRegistered.value) saveGuestTasks();
    },
  });

  onMounted(() => void reloadTasks());

  watch(
    () => isRegistered.value,
    () => void reloadTasks(),
  );

  const addNewTask = async () => {
    if (draftTask.value.text.trim() === "") return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: draftTask.value.text,
      description: draftTask.value.description,
      completed: false,
      deadline: draftTask.value.deadline,
      priority: draftTask.value.priority,
      labels: [...draftTask.value.labels],
    };

    if (isRegistered.value) {
      try {
        const created = await tasksApi.createTask(newTask);
        tasks.value.push({ ...created, labels: newTask.labels });
      } catch (error) {
        handleError(error, "Could not create the task");
        return;
      }
    } else {
      tasks.value.push(newTask);
      saveGuestTasks();
    }
    draftTask.value = createDraftTask();
  };

  const deleteTask = async (taskId: string) => {
    const index = tasks.value.findIndex((task) => task.id === taskId);
    if (index === -1) return;
    const [removed] = tasks.value.splice(index, 1);
    if (isRegistered.value) {
      try {
        await tasksApi.deleteTask(taskId);
      } catch (error) {
        if (removed) tasks.value.splice(index, 0, removed);
        handleError(error, "Could not delete the task");
      }
    } else {
      saveGuestTasks();
    }
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    if (isRegistered.value) {
      try {
        await tasksApi.updateTask(taskId, { completed: task.completed });
      } catch (error) {
        task.completed = !task.completed;
        handleError(error, "Could not update the task");
      }
    } else {
      saveGuestTasks();
    }
  };

  const startEdit = (task: Task) => {
    editing.value = { id: task.id, value: task.text };
  };

  const saveEdit = async () => {
    const id = editing.value.id;
    if (id === null) return;

    const task = tasks.value.find((item) => item.id === id);
    if (!task) return;

    const previousText = task.text;
    task.text = editing.value.value.trim() || task.text;
    editing.value = { id: null, value: "" };
    if (task.text === previousText) return;

    if (isRegistered.value) {
      try {
        await tasksApi.updateTask(id, { text: task.text });
      } catch (error) {
        task.text = previousText;
        handleError(error, "Could not rename the task");
      }
    } else {
      saveGuestTasks();
    }
  };

  const cancelEdit = () => {
    editing.value = { id: null, value: "" };
  };

  const clearCompleted = async () => {
    const completedTasks = tasks.value.filter((task) => task.completed);

    if (!completedTasks.length) {
      toast.info("No completed tasks to clear");
      return;
    }

    const previousTasks = tasks.value.slice();
    tasks.value = tasks.value.filter((task) => !task.completed);
    if (!isRegistered.value) saveGuestTasks();

    // Registered users: delay the server-side delete so "Undo" can cancel it.
    let undone = false;
    const commitDelete = async () => {
      if (undone || !isRegistered.value) return;
      const results = await Promise.allSettled(
        completedTasks.map((task) => tasksApi.deleteTask(task.id)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) {
        toast.error(`Could not delete ${failed} task${failed === 1 ? "" : "s"}`);
        await reloadTasks();
      }
    };
    const deleteTimer = setTimeout(commitDelete, UNDO_TIMEOUT_MS);

    const toastId = toast(
      h("div", { class: "flex items-center gap-3" }, [
        h(
          "span",
          `Cleared ${completedTasks.length} completed task${completedTasks.length === 1 ? "" : "s"}`,
        ),
        h(
          "button",
          {
            class: "bg-green-500 px-2 py-1 rounded text-white font-bold",
            onClick: () => {
              undone = true;
              clearTimeout(deleteTimer);
              tasks.value = previousTasks;
              if (!isRegistered.value) saveGuestTasks();
              toast.dismiss(toastId);
            },
          },
          "Undo",
        ),
      ]),
      { timeout: UNDO_TIMEOUT_MS, closeOnClick: false },
    );
  };

  const toggleArrayLabel = (target: Label[], label: Label) => {
    const index = target.indexOf(label);
    if (index === -1) {
      target.push(label);
      return;
    }
    target.splice(index, 1);
  };

  const toggleDraftLabel = (label: Label) => {
    toggleArrayLabel(draftTask.value.labels, label);
  };

  const resetQuery = () => {
    query.value = { ...createDefaultQuery(), sort: query.value.sort };
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
