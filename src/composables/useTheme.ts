import { computed, ref, watchEffect } from "vue";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const media = window.matchMedia("(prefers-color-scheme: dark)");
const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
const theme = ref<Theme>(stored ?? (media.matches ? "dark" : "light"));

// Follow the OS setting until the user picks a theme explicitly.
media.addEventListener("change", (event) => {
  if (!localStorage.getItem(STORAGE_KEY)) theme.value = event.matches ? "dark" : "light";
});

watchEffect(() => {
  document.documentElement.classList.toggle("dark", theme.value === "dark");
});

export function useTheme() {
  const isDark = computed(() => theme.value === "dark");

  const toggleTheme = () => {
    theme.value = isDark.value ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, theme.value);
  };

  return { theme, isDark, toggleTheme };
}
