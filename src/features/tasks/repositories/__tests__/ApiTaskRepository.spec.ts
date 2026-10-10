import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@/shared/api";
import { ApiTaskRepository } from "../ApiTaskRepository";

function fakeHttp(response: unknown) {
  const http = {
    get: vi.fn(async () => response),
    post: vi.fn(async () => response),
    put: vi.fn(async () => response),
    delete: vi.fn(async () => null),
  };
  return { http, repo: new ApiTaskRepository(http as unknown as HttpClient) };
}

const apiTask = { id: "1", title: "Ship it", priority: "high", completed: false };

describe("ApiTaskRepository", () => {
  it("lists tasks mapped to the UI shape", async () => {
    const { http, repo } = fakeHttp([apiTask]);
    expect(await repo.list()).toEqual([
      expect.objectContaining({ id: "1", text: "Ship it", priority: "high" }),
    ]);
    expect(http.get).toHaveBeenCalledWith("/api/tasks");
  });

  it("creates a task with the API field names and keeps labels", async () => {
    const { http, repo } = fakeHttp(apiTask);
    const created = await repo.create({
      text: "Ship it",
      description: "",
      deadline: "2026-11-01",
      priority: "high",
      labels: ["work"],
    });

    expect(http.post).toHaveBeenCalledWith("/api/tasks", {
      title: "Ship it",
      description: "",
      dueDate: "2026-11-01",
      priority: "high",
    });
    expect(created.labels).toEqual(["work"]);
  });

  it("sends only changed fields on update", async () => {
    const { http, repo } = fakeHttp(apiTask);
    await repo.update("1", { completed: true });
    expect(http.put).toHaveBeenCalledWith("/api/tasks/1", { completed: true });
  });

  it("deletes by id", async () => {
    const { http, repo } = fakeHttp(null);
    await repo.remove("a/b");
    expect(http.delete).toHaveBeenCalledWith("/api/tasks/a%2Fb");
  });
});
