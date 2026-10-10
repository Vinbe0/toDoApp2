import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "../domain/errors.js";
import { InMemoryLabelRepository } from "../infrastructure/memory/InMemoryLabelRepository.js";
import { InMemoryTaskRepository } from "../infrastructure/memory/InMemoryTaskRepository.js";
import { LabelService } from "./LabelService.js";

describe("LabelService", () => {
  let service: LabelService;
  let tasks: InMemoryTaskRepository;

  beforeEach(() => {
    tasks = new InMemoryTaskRepository();
    service = new LabelService(new InMemoryLabelRepository(), tasks);
  });

  it("creates labels and lists only the user's own", async () => {
    await service.createLabel("u1", { name: "Gym", color: "red" });
    await service.createLabel("u2", { name: "Not mine" });

    const labels = await service.listLabels("u1");
    expect(labels.map((l) => [l.name, l.color])).toEqual([["Gym", "red"]]);
  });

  it("picks an unused colour when none is given", async () => {
    const first = await service.createLabel("u1", { name: "A" });
    const second = await service.createLabel("u1", { name: "B" });
    expect(first.color).not.toBe(second.color);
  });

  it("rejects duplicate names regardless of case and spacing", async () => {
    await service.createLabel("u1", { name: "Side project" });
    await expect(service.createLabel("u1", { name: " side  PROJECT " })).rejects.toBeInstanceOf(
      ConflictError,
    );
    // Another user may use the same name.
    await expect(service.createLabel("u2", { name: "Side project" })).resolves.toBeDefined();
  });

  it("renames and recolours, allowing a change of case only", async () => {
    const label = await service.createLabel("u1", { name: "work" });
    await service.createLabel("u1", { name: "Home" });

    expect((await service.updateLabel("u1", label.id, { name: "Work" })).name).toBe("Work");
    expect((await service.updateLabel("u1", label.id, { color: "green" })).color).toBe("green");
    await expect(service.updateLabel("u1", label.id, { name: "home" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("treats other users' labels as not found", async () => {
    const label = await service.createLabel("u1", { name: "Private" });
    await expect(service.updateLabel("u2", label.id, { name: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.deleteLabel("u2", label.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes labels", async () => {
    const label = await service.createLabel("u1", { name: "Temp" });
    await service.deleteLabel("u1", label.id);
    expect(await service.listLabels("u1")).toEqual([]);
  });

  it("creates the default labels once", async () => {
    await service.createDefaultLabels("u1");
    await service.createDefaultLabels("u1");
    expect((await service.listLabels("u1")).map((l) => l.name)).toEqual([
      "Work",
      "Shopping",
      "University",
    ]);
  });

  it("removes a deleted label from tasks", async () => {
    const keep = await service.createLabel("u1", { name: "Keep" });
    const drop = await service.createLabel("u1", { name: "Drop" });
    const task = await tasks.createTask({
      id: "t1",
      userId: "u1",
      title: "Tagged",
      position: 0,
      labelIds: [keep.id, drop.id],
    });

    await service.deleteLabel("u1", drop.id);
    expect((await tasks.getTaskById(task.id))?.labelIds).toEqual([keep.id]);
  });
});
