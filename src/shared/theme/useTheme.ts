import { computed, ref, watchEffect } from "vue";
import { stringItem } from "@/shared/lib/storage";

export type Theme = "light" | "dark";

const storedTheme = stringItem<Theme>("theme", ["light", "dark"]);

const media = window.matchMedia("(prefers-color-scheme: dark)");
const stored = storedTheme.get();
const theme = ref<Theme>(stored ?? (media.matches ? "dark" : "light"));

// Follow the OS setting until the user picks a theme explicitly.
media.addEventListener("change", (event) => {
  if (!storedTheme.get()) theme.value = event.matches ? "dark" : "light";
});

watchEffect(() => {
  document.documentElement.classList.toggle("dark", theme.value === "dark");
});

export function useTheme() {
  const isDark = computed(() => theme.value === "dark");

  const toggleTheme = () => {
    theme.value = isDark.value ? "light" : "dark";
    storedTheme.set(theme.value);
  };

  return { theme, isDark, toggleTheme };
}
