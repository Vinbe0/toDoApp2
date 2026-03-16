<template>
  <h1 class="text-6xl font-extrabold text-center text-green-700 pt-2">TODOS</h1>
  <div class="flex justify-center">
    <div
      class="max-w-2xl mx-auto flex flex-col gap-6 items-center justify-center"
    >
      <form class="flex flex-col gap-2 w-sm" @submit.prevent="addNewTask">
        <label
          for="newTask"
          class="text-center font-bold text-3xl text-amber-50"
          >Add your new task</label
        >
        <input
          v-model="newTaskTitle"
          type="text"
          id="newTask"
          placeholder="Add a new task:)"
          class="border rounded-2xl h-10 bg-amber-50 font-bold px-1 text-black"
        />
        <div class="flex">
          <input
            type="date"
            v-model="newTaskDueDate"
            class="border rounded-2xl h-10 bg-amber-50 font-bold px-1 text-black w-1/2"
            placeholder="Add deadline to your new task"
          />
          <select
            v-model="newTaskPriority"
            class="w-1/2 border rounded-2xl bg-amber-50 text-black font-bold appearance-none"
          >
            <option value="high">🔥 High Priority</option>
            <option value="medium">⚡ Medium Priority</option>
            <option value="low">☁️ Low Priority</option>
          </select>
        </div>
        <button
          type="submit"
          class="border rounded-2xl h-10 bg-green-500 hover:bg-green-600 text-amber-50 font-bold border-green-600 duration-200"
        >
          Add
        </button>
      </form>
      <h1 class="text-center font-bold text-3xl text-amber-50">Your tasks</h1>
      <div
        class="border rounded-2xl min-w-md max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl min-h-10 mx-auto bg-black border-white overflow-hidden"
      >
        <VueDraggable
          v-model="draggableTasks"
          item-key="id"
          class="draggable-list list-none"
        >
          <div
            v-for="task in draggableTasks"
            :key="task.id"
            class="px-4 py-2 text-lg text-amber-50 font-bold flex items-baseline gap-3 min-w-0 overflow-hidden first:rounded-t-2xl last:rounded-b-2xl"
            :class="[
              filter === 'byPriority' ? priorityStyles[task.priority] : '',
            ]"
          >
            <button
              @click="deleteTask(task.id)"
              class="border h-8 w-8 shrink-0 rounded-full bg-green-500 hover:bg-red-500 border-green-600 hover:border-red-600 text-amber-50 font-bold duration-300"
            >
              X
            </button>
            <label class="flex items-baseline gap-2 w-full min-w-0">
              <input
                type="checkbox"
                @click="completeTask(task.id)"
                class="h-5 w-5 rounded-full disabled:cursor-not-allowed"
                :checked="task.completed"
                :class="{
                  'accent-gray-500': task.completed,
                }"
              />
              <div
                v-if="editingTaskId !== task.id"
                @dblclick="startEdit(task)"
                class="flex w-full min-w-0 flex-wrap items-baseline gap-2"
              >
                <span class="flex-1 min-w-0 break-words"
                :class="{ 'line-through text-gray-500': task.completed }"
                >{{ task.text }}</span>
                <span
                  class="shrink-0 text-sm text-gray-400 whitespace-nowrap"
                  >{{ task.deadline }}</span
                >
              </div>
              <input
                v-else
                v-model="editValue"
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                class="border rounded-xl h-8 bg-amber-50 font-bold px-1 text-black ml-2"
              />
            </label>
          </div>
        </VueDraggable>
      </div>
      <div class="flex gap-2 pb-3">
        <button
          @click="filter = 'all'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-1 hover:bg-green-600/40"
          :class="[filter === 'all' ? 'border-amber-50' : 'border-black']"
        >
          All
        </button>
        <button
          @click="filter = 'active'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-1 hover:bg-green-600/40"
          :class="[filter === 'active' ? 'border-amber-50' : 'border-black']"
        >
          Active
        </button>
        <button
          @click="filter = 'completed'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-1 hover:bg-green-600/40"
          :class="[filter === 'completed' ? 'border-amber-50' : 'border-black']"
        >
          Completed
        </button>
        <button
          @click="filter = 'byDate'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-1 hover:bg-green-600/40"
          :class="[filter === 'byDate' ? 'border-amber-50' : 'border-black']"
        >
          Sort all by date
        </button>
        <button
          @click="filter = 'byPriority'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-1 hover:bg-green-600/40"
          :class="[
            filter === 'byPriority' ? 'border-amber-50' : 'border-black',
          ]"
        >
          Sort by priority
        </button>
        <button
          @click="clearCompleted"
          class="border border-red-500 bg-red-500 hover:bg-red-600 text-amber-50 font-bold rounded-2xl px-1 py-2 duration-200"
        >
          Clear completed tasks
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, h } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { useToast } from "vue-toastification";

const newTaskTitle = ref<string>("");
const tasks = ref<Task[]>([]);
let filter = ref<"all" | "active" | "completed" | "byDate" | "byPriority">(
  "all",
);
const STORAGE_KEY = "my-tasks";
const toast = useToast();
const editingTaskId = ref<number | null>(null);
const editValue = ref<string>("");
const newTaskDueDate = ref<string | null>(null);
const newTaskPriority = ref<Priority>("medium");

type Priority = "high" | "medium" | "low";

interface Task {
  id: number;
  text: string;
  completed: boolean;
  deadline: string | null;
  priority: Priority;
}

const priorityWeight: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

const priorityStyles: Record<string, string> = {
  high: "bg-red-600/80",
  medium: "bg-yellow-600/80",
  low: "bg-green-600/80",
};

const compareText = (a: Task, b: Task) => a.text.localeCompare(b.text);

const compareDate = (a: Task, b: Task) => {
  const aTime = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY;
  const bTime = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY;
  return aTime - bTime;
};

const comparePriority = (a: Task, b: Task) => {
  priorityWeight[a.priority] - priorityWeight[b.priority];
};

onMounted(() => {
  const storedTasks = localStorage.getItem(STORAGE_KEY);

  if (storedTasks) {
    try {
      const parsed = JSON.parse(storedTasks) as Partial<Task>[];
      tasks.value = parsed.map((task) => ({
        id: typeof task.id === "number" ? task.id : Date.now(),
        text: typeof task.text === "string" ? task.text : "",
        completed: Boolean(task.completed),
        deadline: task.deadline ?? null,
        priority:
          task.priority === "high" ||
          task.priority === "medium" ||
          task.priority === "low"
            ? task.priority
            : "medium",
      }));
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});

const addNewTask = () => {
  if (newTaskTitle.value.trim() === "") return;

  const newTask: Task = {
    id: Date.now(),
    text: newTaskTitle.value,
    completed: false,
    deadline: newTaskDueDate.value,
    priority: newTaskPriority.value,
  };

  tasks.value.push(newTask);
  newTaskTitle.value = "";
  newTaskDueDate.value = null;
};

watch(
  tasks,
  (newTasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  },
  { deep: true },
);

const deleteTask = (taskId) => {
  const index = tasks.value.findIndex((task) => task.id === taskId);
  if (index === -1) return;
  tasks.value.splice(index, 1);
};

const completeTask = (taskId) => {
  const index = tasks.value.findIndex((task) => task.id === taskId);
  if (index === -1) return;
  tasks.value[index].completed = !tasks.value[index].completed;
};

const startEdit = (task) => {
  editingTaskId.value = task.id;
  editValue.value = task.text;
};

const saveEdit = () => {
  const task = tasks.value.find((t) => t.id === editingTaskId.value);
  if (!task) return;

  task.text = editValue.value.trim() || task.text;
  editingTaskId.value = null;
};

const filteredTasks = computed(() => {
  const result = [...tasks.value];

  if (filter.value === "active") {
    return result.filter((task) => !task.completed);
  } else if (filter.value === "completed") {
    return result.filter((task) => task.completed);
  } else if (filter.value === "byDate") {
    return result.sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return compareText(a, b);
    });
  } else if (filter.value === "byPriority") {
    return result.sort((a, b) => {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
      return compareText(a, b);
    });
  }

  return result;
});

const draggableTasks = computed({
  get() {
    return filteredTasks.value;
  },
  set(newOrder) {
    const filteredIds = filteredTasks.value.map((t) => t.id);
    let i = 0;

    tasks.value = tasks.value.map((task) => {
      if (filteredIds.includes(task.id)) {
        return newOrder[i++];
      }
      return task;
    });
  },
});

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
</script>
