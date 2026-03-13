<template>
  <h1 class="text-6xl font-extrabold text-center text-green-700 pt-2">TODOS</h1>
  <div class="flex justify-center">
    <div
      class="max-w-2xl mx-auto flex flex-col gap-6 items-center justify-center"
    >
      <form class="flex flex-col gap-2 w-96" @submit.prevent="addNewTask">
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
        <button
          type="submit"
          class="border rounded-2xl h-10 bg-green-500 hover:bg-green-600 text-amber-50 font-bold border-green-600 duration-200"
        >
          Add
        </button>
      </form>
      <h1 class="text-center font-bold text-3xl text-amber-50">Your tasks</h1>
      <div
        class="border rounded-2xl w-96 min-h-10 mx-auto bg-black border-white"
      >
        <VueDraggable
          v-model="draggableTasks"
          item-key="id"
          class="draggable-list list-none"
        >
          <div
            v-for="task in draggableTasks"
            :key="task.id"
            class="px-4 py-2 text-lg text-amber-50 font-bold"
            :class="{
              'line-through': task.completed,
            }"
          >
            <button
              @click="deleteTask(task.id)"
              class="border h-8 w-8 rounded-full bg-green-500 hover:bg-red-500 border-green-600 hover:border-red-600 text-amber-50 font-bold duration-300"
            >
              X
            </button>
            <label>
              <input
                type="checkbox"
                @click="completeTask(task.id)"
                class="h-5 w-5 rounded-full disabled:cursor-not-allowed"
                :checked="task.completed"
                :class="{
                  'accent-gray-500': task.completed,
                }"
              />
              <span
              >
              {{ task.text }}
              </span>
            </label>
          </div>
        </VueDraggable>
      </div>
      <div class="flex gap-2 pb-3">
        <button
          @click="filter = 'all'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-2 hover:bg-green-600/40"
          :class="[filter === 'all' ? 'border-amber-50' : 'border-black']"
        >
          All
        </button>
        <button
          @click="filter = 'active'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-2 hover:bg-green-600/40"
          :class="[filter === 'active' ? 'border-amber-50' : 'border-black']"
        >
          Active
        </button>
        <button
          @click="filter = 'completed'"
          class="border-2 bg-black text-amber-50 font-bold rounded-2xl px-2 hover:bg-green-600/40"
          :class="[filter === 'completed' ? 'border-amber-50' : 'border-black']"
        >
          Completed
        </button>
        <button
          @click="clearCompleted"
          class="border border-red-500 bg-red-500 hover:bg-red-600 text-amber-50 font-bold rounded-2xl px-2 py-2 duration-200"
        >
          Clear completed tasks
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, h } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { useToast } from "vue-toastification";

const newTaskTitle = ref("");
const tasks = ref([]);
let filter = ref("all");
const STORAGE_KEY = "my-tasks";
const toast = useToast();
const editingTaskId = ref(null);
const editValue = ref("")

onMounted(() => {
  const storedTasks = localStorage.getItem(STORAGE_KEY);

  if (storedTasks) {
    try {
      tasks.value = JSON.parse(storedTasks);
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});

const addNewTask = () => {
  if (newTaskTitle.value.trim() === "") return;

  const newTask = {
    id: Date.now(),
    text: newTaskTitle.value,
    completed: false,
  };

  tasks.value.push(newTask);
  newTaskTitle.value = "";
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
  editingTaskId.value = task.id
  editValue.value = task.text
}

const saveEdit = () => {
  const task = tasks.value.find(t => t.id === editingTaskId.value)
  if(!task) return

  task.text = editValue.value.trim() || task.text;
  editingTaskId.value = null;
}

const filteredTasks = computed(() => {
  if (filter.value === "active") {
    return tasks.value.filter((task) => !task.completed);
  }

  if (filter.value === "completed") {
    return tasks.value.filter((task) => task.completed);
  }

  return tasks.value;
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
