import { computed, ref, watch } from "vue";
import { defineStore, storeToRefs } from "pinia";
import {
  nextLabelColor,
  normalizeLabelName,
  validateLabelName,
} from "@/features/tasks/model/label";
import type { Label, LabelColor } from "@/features/tasks/model/types";
import { labelRepositories, taskRepositories } from "@/features/tasks/repositories";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { notify } from "@/shared/lib/notify";

type LoadStatus = "idle" | "loading" | "ready" | "error";

export const useLabelsStore = defineStore("labels", () => {
  const { isRegistered } = storeToRefs(useAuthStore());

  const labels = ref<Label[]>([]);
  const status = ref<LoadStatus>("idle");

  const repository = computed(() =>
    isRegistered.value ? labelRepositories.api : labelRepositories.local,
  );

  const byId = computed(() => new Map(labels.value.map((label) => [label.id, label])));

  /** The labels with these ids, in the sidebar's order (unknown ids are skipped). */
  function resolve(ids: readonly string[]): Label[] {
    return labels.value.filter((label) => ids.includes(label.id));
  }

  async function load() {
    status.value = "loading";
    try {
      labels.value = await repository.value.list();
      status.value = "ready";
    } catch (error) {
      status.value = "error";
      notify.fromError(error, "Could not load your labels");
    }
  }

  // Switching between guest and account storage reloads the labels.
  watch(isRegistered, () => {
    if (status.value !== "idle") void load();
  });

  /** Returns the new label, or null if the name is invalid or saving failed. */
  async function create(name: string, color?: LabelColor): Promise<Label | null> {
    const problem = validateLabelName(name, labels.value);
    if (problem) {
      notify.error(problem);
      return null;
    }
    try {
      const label = await repository.value.create({
        name: normalizeLabelName(name),
        color: color ?? nextLabelColor(labels.value),
      });
      labels.value.push(label);
      return label;
    } catch (error) {
      notify.fromError(error, "Could not create the label");
      return null;
    }
  }

  /** Applies a change right away and rolls it back if saving fails. */
  async function change(id: string, patch: { name?: string; color?: LabelColor }) {
    const label = labels.value.find((item) => item.id === id);
    if (!label) return false;
    const previous = { ...label };
    Object.assign(label, patch);
    try {
      Object.assign(label, await repository.value.update(id, patch));
      return true;
    } catch (error) {
      Object.assign(label, previous);
      notify.fromError(error, "Could not update the label");
      return false;
    }
  }

  async function rename(id: string, name: string): Promise<boolean> {
    const current = byId.value.get(id);
    if (!current || normalizeLabelName(name) === current.name) return true;
    const problem = validateLabelName(name, labels.value, id);
    if (problem) {
      notify.error(problem);
      return false;
    }
    return change(id, { name: normalizeLabelName(name) });
  }

  function recolor(id: string, color: LabelColor) {
    return change(id, { color });
  }

  async function remove(id: string) {
    const index = labels.value.findIndex((label) => label.id === id);
    const label = labels.value[index];
    if (!label) return;

    labels.value.splice(index, 1);
    useTasksStore().forgetLabel(id);
    try {
      await repository.value.remove(id);
      // The server removes the label from tasks itself; guest tasks are updated here.
      if (!isRegistered.value) await taskRepositories.local.removeLabel(id);
    } catch (error) {
      labels.value.splice(index, 0, label);
      notify.fromError(error, "Could not delete the label");
      await useTasksStore().load();
    }
  }

  return { labels, status, byId, resolve, load, create, rename, recolor, remove };
});
