import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

describe("HTTP API", () => {
  it("reports health", async () => {
    const { api } = createTestApp();
    const res = await api.get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns JSON 404s for unknown routes", async () => {
    const { api } = createTestApp();
    const res = await api.get("/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "NotFound", message: "Route not found" });
  });

  describe("auth", () => {
    it("registers (201) and logs in (200)", async () => {
      const { api } = createTestApp();
      const body = { email: "me@example.com", password: "password123" };

      const registered = await api.post("/api/auth/register").send(body);
      expect(registered.status).toBe(201);
      expect(registered.body.user.email).toBe("me@example.com");

      const loggedIn = await api.post("/api/auth/login").send(body);
      expect(loggedIn.status).toBe(200);
      expect(loggedIn.body.token).toEqual(expect.any(String));
    });

    it("returns 409 for an existing email and 401 for bad credentials", async () => {
      const { api, signUp } = createTestApp();
      const { email } = await signUp();

      const duplicate = await api
        .post("/api/auth/register")
        .send({ email, password: "password123" });
      expect(duplicate.status).toBe(409);

      const wrong = await api.post("/api/auth/login").send({ email, password: "wrong-password" });
      expect(wrong.status).toBe(401);
      expect(wrong.body.message).toBe("Invalid email or password");
    });
  });

  describe("tasks", () => {
    it("requires a token", async () => {
      const { api } = createTestApp();
      expect((await api.get("/api/tasks")).status).toBe(401);
      expect((await api.get("/api/tasks").set("Authorization", "Bearer bad")).status).toBe(401);
    });

    it("supports create, list, update and delete", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();

      const created = await api
        .post("/api/tasks")
        .set(auth)
        .send({ title: "Write tests", priority: "high", dueDate: "2026-11-01" });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ title: "Write tests", priority: "high" });
      const id = created.body.id as string;

      const list = await api.get("/api/tasks").set(auth);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).not.toHaveProperty("userId");

      const updated = await api.put(`/api/tasks/${id}`).set(auth).send({ completed: true });
      expect(updated.status).toBe(200);
      expect(updated.body.completed).toBe(true);

      const deleted = await api.delete(`/api/tasks/${id}`).set(auth);
      expect(deleted.status).toBe(204);
      expect((await api.get("/api/tasks").set(auth)).body).toEqual([]);
    });

    it("returns 400 for an empty title and 404 for an unknown task", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();

      expect((await api.post("/api/tasks").set(auth).send({ title: "" })).status).toBe(400);
      expect((await api.put("/api/tasks/missing").set(auth).send({ title: "x" })).status).toBe(404);
    });

    it("only lists the signed-in user's tasks", async () => {
      const { api, signUp } = createTestApp();
      const alice = await signUp();
      const bob = await signUp();
      await api.post("/api/tasks").set(alice.auth).send({ title: "Alice's task" });

      expect((await api.get("/api/tasks").set(bob.auth)).body).toEqual([]);
    });

    it("does not let one user change or delete another user's task", async () => {
      const { api, signUp } = createTestApp();
      const alice = await signUp();
      const bob = await signUp();
      const { body: task } = await api
        .post("/api/tasks")
        .set(alice.auth)
        .send({ title: "Alice's task" });

      const update = await api.put(`/api/tasks/${task.id}`).set(bob.auth).send({ title: "Hacked" });
      const remove = await api.delete(`/api/tasks/${task.id}`).set(bob.auth);

      // 404, not 403: don't reveal that the task exists.
      expect(update.status).toBe(404);
      expect(remove.status).toBe(404);
      const { body: aliceTasks } = await api.get("/api/tasks").set(alice.auth);
      expect(aliceTasks).toEqual([expect.objectContaining({ title: "Alice's task" })]);
    });
  });
});
