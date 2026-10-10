import { describe, expect, it } from "vitest";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import type { Label } from "@/features/tasks/model/types";
import type { StorageItem } from "@/shared/lib/storage";
import { LocalLabelRepository } from "../LocalLabelRepository";

function memoryStorage(): StorageItem<Label[]> & { raw: () => Label[] | null } {
  let value: Label[] | null = null;
  return {
    get: () => (value ? structuredClone(value) : null),
    set: (next) => (value = structuredClone(next)),
    remove: () => (value = null),
    raw: () => value,
  };
}

const setup = () => {
  const storage = memoryStorage();
  let id = 0;
  return { storage, repo: new LocalLabelRepository(storage, () => `id-${++id}`) };
};

describe("LocalLabelRepository", () => {
  it("starts with the default labels", async () => {
    const { repo } = setup();
    expect(await repo.list()).toEqual(DEFAULT_LABELS);
  });

  it("creates labels after the defaults and normalizes names", async () => {
    const { repo, storage } = setup();
    const gym = await repo.create({ name: "  Gym   time ", color: "red" });

    expect(gym).toEqual({ id: "id-1", name: "Gym time", color: "red" });
    expect(storage.raw()?.map((label) => label.name)).toEqual([
      "Work",
      "Shopping",
      "University",
      "Gym time",
    ]);
  });

  it("renames, recolours and deletes", async () => {
    const { repo } = setup();
    expect(await repo.update("work", { name: "Job", color: "teal" })).toEqual({
      id: "work",
      name: "Job",
      color: "teal",
    });
    await repo.remove("shopping");
    expect((await repo.list()).map((label) => label.id)).toEqual(["work", "university"]);
  });

  it("rejects updates to unknown labels", async () => {
    const { repo } = setup();
    await expect(repo.update("nope", { name: "x" })).rejects.toThrow("Label not found");
  });
});
