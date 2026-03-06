<template>
  <main
    class="relative min-h-screen bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${bgwebImage})` }"
  >
    <h1 class="text-6xl font-extrabold text-center text-green-700 pt-1">
      TODOS
    </h1>
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
          <ul>
            <li
              v-for="(task, index) in filteredTasks"
              :key="task.id"
              class="px-4 py-2 text-lg text-amber-50 font-bold"
              :class="{
                'line-through': task.completed,
              }"
            >
              <button
                @click="deleteTask(index)"
                class="border h-8 w-8 rounded-full bg-green-500 hover:bg-red-500 border-green-600 hover:border-red-600 text-amber-50 font-bold duration-300"
              >
                X
              </button>
              <input
                type="checkbox"
                @click="completeTask(index)"
                class="h-5 w-5 rounded-full disabled:cursor-not-allowed"
                :disabled="task.completed"
              />
              {{ task.text }}
            </li>
          </ul>
        </div>
        <div class="flex gap-2">
          <button @click="filter = 'all'" class="border border-black bg-black text-amber-50 font-bold rounded-2xl px-2">All</button>
          <button @click="filter = 'active'" class="border border-black bg-black text-amber-50 font-bold rounded-2xl px-2">Active</button>
          <button @click="filter = 'completed'" class="border border-black bg-black text-amber-50 font-bold rounded-2xl px-2">Completed</button>
          <button @click="clearCompleted" class="border border-black bg-black text-amber-50 font-bold rounded-2xl px-2">Clear completed tasks</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import bgwebImage from "@/assets/bgweb.jpg";

const newTaskTitle = ref("");
const tasks = ref([]);
let filter = ref("all");
const STORAGE_KEY = "my-tasks";

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

const deleteTask = (index) => {
  tasks.value.splice(index, 1);
};

const completeTask = (index) => {
  tasks.value[index].completed = true;
};

const filteredTasks = computed(() => {
  if(filter.value === 'active'){
    return tasks.value.filter(task => !task.completed)
  }

  if(filter.value === 'completed'){
    return tasks.value.filter(task => task.completed)
  }

  return tasks.value
})

const clearCompleted = () => {
 tasks.value = tasks.value.filter(task => !task.completed)
}
</script>
