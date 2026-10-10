import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/http/app.js";
import { createTestApp, createTestServices } from "./helpers.js";

describe("HTTP API", () => {
  it("reports health", async () => {
    const { api } = createTestApp();
    const res = await api.get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("sends security headers and hides the framework", async () => {
    const { api } = createTestApp();
    const res = await api.get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("only allows configured CORS origins", async () => {
    const app = createApp({ ...createTestServices(), corsOrigins: ["http://localhost:5173"] });
    const allowed = await request(app).get("/health").set("Origin", "http://localhost:5173");
    const blocked = await request(app).get("/health").set("Origin", "https://evil.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rate-limits auth attempts", async () => {
    const app = createApp({ ...createTestServices(), authRateLimit: 2 });
    const attempt = () =>
      request(app).post("/api/auth/login").send({ email: "a@b.co", password: "wrong-password" });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("TooManyRequests");
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

  describe("validation", () => {
    it("rejects invalid fields with 400 and per-field details", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();

      const res = await api
        .post("/api/tasks")
        .set(auth)
        .send({ title: "x", priority: "urgent", dueDate: "someday" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
      expect(res.body.details.map((d: { field: string }) => d.field)).toEqual([
        "dueDate",
        "priority",
      ]);
    });

    it("rejects unknown fields and empty updates", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();
      const { body: task } = await api.post("/api/tasks").set(auth).send({ title: "x" });

      expect(
        (await api.post("/api/tasks").set(auth).send({ title: "x", userId: "u2" })).status,
      ).toBe(400);
      expect((await api.put(`/api/tasks/${task.id}`).set(auth).send({})).status).toBe(400);
    });

    it("returns 400 for malformed JSON", async () => {
      const { api } = createTestApp();
      const res = await api
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send("{not json");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Request body is not valid JSON");
    });

    it("normalizes emails so login is case-insensitive", async () => {
      const { api } = createTestApp();
      await api
        .post("/api/auth/register")
        .send({ email: " Me@Example.com ", password: "password123" });
      const res = await api
        .post("/api/auth/login")
        .send({ email: "me@example.com", password: "password123" });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("me@example.com");
    });

    it("validates the label filter", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();
      expect((await api.get("/api/tasks?label=gym").set(auth)).status).toBe(400);
      expect(
        (
          await api
            .post("/api/tasks")
            .set(auth)
            .send({ title: "x", labels: ["gym"] })
        ).status,
      ).toBe(400);
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
        .send({ title: "Write tests", priority: "high", dueDate: "2026-11-01", labels: ["work"] });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({
        title: "Write tests",
        priority: "high",
        labels: ["work"],
      });
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

    it("saves a manual order", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();
      const ids: string[] = [];
      for (const title of ["A", "B", "C"]) {
        ids.push((await api.post("/api/tasks").set(auth).send({ title })).body.id);
      }

      const res = await api
        .put("/api/tasks/order")
        .set(auth)
        .send({ ids: [ids[2], ids[0]] });
      expect(res.status).toBe(200);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual(["C", "A", "B"]);
      const list = await api.get("/api/tasks").set(auth);
      expect(list.body.map((t: { title: string }) => t.title)).toEqual(["C", "A", "B"]);

      expect(
        (
          await api
            .put("/api/tasks/order")
            .set(auth)
            .send({ ids: ["nope"] })
        ).status,
      ).toBe(400);
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
