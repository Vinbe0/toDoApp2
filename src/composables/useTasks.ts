import { computed, h, onMounted, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import type { FilterMode, Label, Priority, Task } from "@/types/todo";
import { useAuth } from "./useAuth";
import { tasksApi } from "@/api/tasksApi";

const GUEST_STORAGE_KEY = "guest-tasks";

const { isRegistered } = useAuth()

export const availableLabels: Label[] = ["work", "shopping", "university"];

const priorityWeight: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

export const priorityStyles: Record<Priority, string> = {
  high: "bg-red-400/20 border rounded-2xl border-red-500 text-red-600 px-2",
  medium:
    "bg-yellow-400/20 border rounded-2xl border-yellow-500 text-yellow-600 px-2",
  low: "bg-green-400/20 border rounded-2xl border-green-500 text-green-600 px-2",
};

type DraftTask = Pick<
  Task,
  "text" | "description" | "deadline" | "priority" | "labels"
>;

type EditingState = {
  id: number | null;
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


  function saveGuestTasks(){
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(tasks.value))
  }

  function loadGuestTasks(){
    const storedTasks = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!storedTasks) return;

    try {
      const parsed = JSON.parse(storedTasks) as Partial<Task>[];
      tasks.value = parsed.map((task) => ({
        id: typeof task.id === "number" ? task.id : Date.now(),
        text: typeof task.text === "string" ? task.text : "",
        description: typeof task.description === "string" ? task.description : "",
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
      tasks.value = await tasksApi.getTasks()
    }
    else {
      loadGuestTasks()
    }
  }

  const compareText = (a: Task, b: Task) => a.text.localeCompare(b.text);

  const compareDate = (a: Task, b: Task) => {
    const aTime = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY;
    const bTime = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY;
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
          return newOrder[index++];
        }
        return task;
      });
    },
  });

  onMounted(() => void reloadTasks());

  watch(() => isRegistered.value, () => void reloadTasks());

  const addNewTask = () => {
    if (draftTask.value.text.trim() === "") return;

    const newTask: Task = {
      id: Date.now(),
      text: draftTask.value.text,
      description: draftTask.value.description,
      completed: false,
      deadline: draftTask.value.deadline,
      priority: draftTask.value.priority,
      labels: [...draftTask.value.labels],
    };

    tasks.value.push(newTask);
    draftTask.value = createDraftTask();
  };

  const deleteTask = async (taskId: number) => {
    const index = tasks.value.findIndex((task) => task.id === taskId);
      if ( index === -1 ) return;
      tasks.value.splice(index, 1);
    if(isRegistered.value){
      await tasksApi.deleteTask(taskId)
    }
    else{
      saveGuestTasks()
    }
  };

  const completeTask = async (taskId: number) => {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;
    if(isRegistered.value) {
      task.completed = !task.completed;
      await tasksApi.updateTask(taskId, {
        completed: !task.completed
      })
    }
    else{
    task.completed = !task.completed;
    saveGuestTasks();
    }
  };

  const startEdit = (task: Task) => {
    editing.value = { id: task.id, value: task.text };
  };

  const saveEdit = () => {
    if (editing.value.id === null) return;

    const task = tasks.value.find((item) => item.id === editing.value.id);
    if (!task) return;

    task.text = editing.value.value.trim() || task.text;
    editing.value = { id: null, value: "" };
  };

  const clearCompleted = () => {
    const completedTasks = tasks.value.filter((task) => task.completed);

    if (!completedTasks.length) {
      toast.info("No completed tasks to clear");
      return;
    }

    const previousTasks = tasks.value.slice();
    tasks.value = tasks.value.filter((task) => !task.completed);

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
              tasks.value = previousTasks;
              toast.dismiss(toastId);
            },
          },
          "Undo",
        ),
      ]),
      { timeout: 5000, closeOnClick: false },
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
    clearCompleted,
    openLabelFilter,
    toggleDraftLabel,
    toggleSelectedLabel,
  };
}
