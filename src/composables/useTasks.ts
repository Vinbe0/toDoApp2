import { computed, h, onMounted, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import type { FilterMode, Label, Priority, Task } from "@/types/todo";
import { useAuth } from "./useAuth";
import { tasksApi } from "@/api/tasksApi";
import { ApiError } from "@/api/client";

const GUEST_STORAGE_KEY = "guest-tasks";

const { isRegistered, logout } = useAuth();

const UNDO_TIMEOUT_MS = 5000;

export const availableLabels: Label[] = ["work", "shopping", "university"];

const priorityWeight: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

type DraftTask = Pick<
  Task,
  "text" | "description" | "deadline" | "priority" | "labels"
>;

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
  const filter = ref<FilterMode>("all");
  const draftTask = ref<DraftTask>(createDraftTask());
  const editing = ref<EditingState>({ id: null, value: "" });
  const selectedLabels = ref<Label[]>([]);
  const labelFilterOpen = ref<boolean>(false);
  const strictLabelFilter = ref<boolean>(false);
  const searchTitle = ref<string>("");

  function handleError(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      toast.error("Your session has expired. Please log in again.");
      return;
    }
    toast.error(error instanceof Error ? error.message : fallback);
  }

  function saveGuestTasks() {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(tasks.value));
  }

  async function importGuestTasks() {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if(!raw) return
    const guestTasks = JSON.parse(raw);

    const result = window.confirm("Do you want to import your tasks?")
    if(result){
      for(const task of guestTasks){
        await tasksApi.createTask(task)
      }
      localStorage.removeItem(GUEST_STORAGE_KEY)
    }
  }

  function loadGuestTasks() {
    const storedTasks = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!storedTasks) return;

    try {
      const parsed = JSON.parse(storedTasks) as Partial<Task>[];
      tasks.value = parsed.map((task) => ({
        id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
        text: typeof task.text === "string" ? task.text : "",
        description:
          typeof task.description === "string" ? task.description : "",
        completed: Boolean(task.completed),
        deadline: task.deadline ?? null,
        priority:
          task.priority === "high" ||
          task.priority === "medium" ||
          task.priority === "low"
            ? task.priority
            : "medium",
        labels: Array.isArray(task.labels) ? task.labels : [],
      }));
    } catch {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
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

  const compareText = (a: Task, b: Task) => a.text.localeCompare(b.text);

  const compareDate = (a: Task, b: Task) => {
    const aTime = a.deadline
      ? Date.parse(a.deadline)
      : Number.POSITIVE_INFINITY;
    const bTime = b.deadline
      ? Date.parse(b.deadline)
      : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  };

  const comparePriority = (a: Task, b: Task) =>
    priorityWeight[a.priority] - priorityWeight[b.priority];

  const filterLabelAll = () => {
    if (!selectedLabels.value.length) return tasks.value;
    return tasks.value.filter((task) =>
      selectedLabels.value.every((label) => task.labels.includes(label)),
    );
  };

  const filterLabelSome = () => {
    if (!selectedLabels.value.length) return tasks.value;
    return tasks.value.filter((task) =>
      task.labels.some((label) => selectedLabels.value.includes(label)),
    );
  };

  const filteredTasks = computed(() => {
    const result = [...tasks.value];

    if (filter.value === "active") {
      return result.filter((task) => !task.completed);
    }

    if (filter.value === "completed") {
      return result.filter((task) => task.completed);
    }

    if (filter.value === "byDate") {
      return result.sort((a, b) => {
        const byDate = compareDate(a, b);
        if (byDate !== 0) return byDate;
        const byPriority = comparePriority(a, b);
        if (byPriority !== 0) return byPriority;
        return compareText(a, b);
      });
    }

    if (filter.value === "byPriority") {
      return result.sort((a, b) => {
        const byPriority = comparePriority(a, b);
        if (byPriority !== 0) return byPriority;
        const byDate = compareDate(a, b);
        if (byDate !== 0) return byDate;
        return compareText(a, b);
      });
    }

    if (filter.value === "byLabel") {
      return strictLabelFilter.value ? filterLabelAll() : filterLabelSome();
    }

    if (filter.value === "byTitle") {
      const query = searchTitle.value.trim().toLowerCase();
      if (!query) return result;
      return result.filter((task) => task.text.toLowerCase().includes(query));
    }

    return result;
  });

  const draggableTasks = computed({
    get() {
      return filteredTasks.value;
    },
    set(newOrder: Task[]) {
      const filteredIds = filteredTasks.value.map((task) => task.id);
      let index = 0;

      tasks.value = tasks.value.map((task) => {
        if (filteredIds.includes(task.id)) {
          return newOrder[index++] ?? task;
        }
        return task;
      });
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

  const openLabelFilter = () => {
    filter.value = "byLabel";
    labelFilterOpen.value = !labelFilterOpen.value;
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

  const toggleSelectedLabel = (label: Label) => {
    toggleArrayLabel(selectedLabels.value, label);
  };

  const handleSearch = () => {
    filter.value = "byTitle";
  };

  return {
    tasks,
    filter,
    draftTask,
    editing,
    selectedLabels,
    labelFilterOpen,
    searchTitle,
    strictLabelFilter,
    filteredTasks,
    draggableTasks,
    addNewTask,
    deleteTask,
    handleSearch,
    completeTask,
    startEdit,
    saveEdit,
    cancelEdit,
    clearCompleted,
    openLabelFilter,
    toggleDraftLabel,
    toggleSelectedLabel,
    importGuestTasks,
  };
}
