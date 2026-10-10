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

    // Session checks are not throttled.
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
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

    it("returns the current user for a valid token", async () => {
      const { api, signUp } = createTestApp();
      const { email, auth } = await signUp();

      const me = await api.get("/api/auth/me").set(auth);
      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe(email);
      expect((await api.get("/api/auth/me")).status).toBe(401);
    });

    it("rejects tokens for accounts that no longer exist", async () => {
      const { api, tokenService } = createTestApp();
      const token = tokenService.sign({ userId: crypto.randomUUID(), email: "gone@example.com" });
      const res = await api.get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(401);
    });

    describe("deleting an account", () => {
      it("deletes the account, its data and makes old tokens stop working", async () => {
        const { api, signUp } = createTestApp();
        const { email, auth } = await signUp();
        await api.post("/api/tasks").set(auth).send({ title: "Mine" });

        const res = await api.delete("/api/auth/me").set(auth).send({ password: "password123" });
        expect(res.status).toBe(204);

        // The token is still well-formed and unexpired, but the account is gone.
        expect((await api.get("/api/tasks").set(auth)).status).toBe(401);
        expect((await api.post("/api/tasks").set(auth).send({ title: "x" })).status).toBe(401);
        expect((await api.get("/api/auth/me").set(auth)).status).toBe(401);
        const login = await api.post("/api/auth/login").send({ email, password: "password123" });
        expect(login.status).toBe(401);
      });

      it("allows signing up again with the same email afterwards", async () => {
        const { api, signUp } = createTestApp();
        const { email, auth } = await signUp();
        await api.delete("/api/auth/me").set(auth).send({ password: "password123" });

        const again = await api.post("/api/auth/register").send({ email, password: "password123" });
        expect(again.status).toBe(201);
      });

      it("returns 403 for a wrong password (not 401, which would log the user out)", async () => {
        const { api, signUp } = createTestApp();
        const { auth } = await signUp();

        const res = await api.delete("/api/auth/me").set(auth).send({ password: "wrong-password" });
        expect(res.status).toBe(403);
        expect(res.body.message).toBe("Incorrect password");
        expect((await api.get("/api/auth/me").set(auth)).status).toBe(200);
      });

      it("requires a password and a token", async () => {
        const { api, signUp } = createTestApp();
        const { auth } = await signUp();

        expect((await api.delete("/api/auth/me").set(auth).send({})).status).toBe(400);
        expect((await api.delete("/api/auth/me").send({ password: "password123" })).status).toBe(
          401,
        );
      });
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

  describe("labels", () => {
    it("gives new accounts the default labels", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();

      const res = await api.get("/api/labels").set(auth);
      expect(res.status).toBe(200);
      expect(res.body.map((l: { name: string }) => l.name)).toEqual([
        "Work",
        "Shopping",
        "University",
      ]);
      expect(res.body[0]).toEqual({ id: expect.any(String), name: "Work", color: "sky" });
    });

    it("creates, renames, recolours and deletes labels", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();

      const created = await api.post("/api/labels").set(auth).send({ name: "  Gym " });
      expect(created.status).toBe(201);
      expect(created.body.name).toBe("Gym");

      const renamed = await api
        .put(`/api/labels/${created.body.id}`)
        .set(auth)
        .send({ name: "Fitness", color: "red" });
      expect(renamed.body).toMatchObject({ name: "Fitness", color: "red" });

      expect((await api.delete(`/api/labels/${created.body.id}`).set(auth)).status).toBe(204);
      const names = (await api.get("/api/labels").set(auth)).body.map(
        (l: { name: string }) => l.name,
      );
      expect(names).not.toContain("Fitness");
    });

    it("rejects duplicates, bad colours and empty updates", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();

      const duplicate = await api.post("/api/labels").set(auth).send({ name: "work" });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.message).toBe('A label named "Work" already exists');

      expect(
        (await api.post("/api/labels").set(auth).send({ name: "x", color: "gold" })).status,
      ).toBe(400);
      expect((await api.post("/api/labels").set(auth).send({ name: "" })).status).toBe(400);
    });

    it("filters tasks by label and drops deleted labels from tasks", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();
      const { body: gym } = await api.post("/api/labels").set(auth).send({ name: "Gym" });
      await api
        .post("/api/tasks")
        .set(auth)
        .send({ title: "Run", labelIds: [gym.id] });
      await api.post("/api/tasks").set(auth).send({ title: "Read" });

      const filtered = await api.get(`/api/tasks?labelId=${gym.id}`).set(auth);
      expect(filtered.body.map((t: { title: string }) => t.title)).toEqual(["Run"]);

      await api.delete(`/api/labels/${gym.id}`).set(auth);
      const { body: tasks } = await api.get("/api/tasks").set(auth);
      expect(tasks.find((t: { title: string }) => t.title === "Run").labelIds).toEqual([]);
    });

    it("keeps labels private to their owner", async () => {
      const { api, signUp } = createTestApp();
      const alice = await signUp();
      const bob = await signUp();
      const { body: label } = await api
        .post("/api/labels")
        .set(alice.auth)
        .send({ name: "Secret" });

      expect(
        (await api.put(`/api/labels/${label.id}`).set(bob.auth).send({ name: "x" })).status,
      ).toBe(404);
      expect((await api.delete(`/api/labels/${label.id}`).set(bob.auth)).status).toBe(404);
      expect((await api.get("/api/labels")).status).toBe(401);
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

    it("validates label ids on tasks and in the filter", async () => {
      const { api, signUp } = createTestApp();
      const { auth } = await signUp();
      const unknownId = crypto.randomUUID();

      expect((await api.get("/api/tasks?labelId=gym").set(auth)).status).toBe(400);
      expect((await api.get(`/api/tasks?labelId=${unknownId}`).set(auth)).status).toBe(400);
      expect(
        (
          await api
            .post("/api/tasks")
            .set(auth)
            .send({ title: "x", labelIds: ["gym"] })
        ).status,
      ).toBe(400);
      const unknown = await api
        .post("/api/tasks")
        .set(auth)
        .send({ title: "x", labelIds: [unknownId] });
      expect(unknown.status).toBe(400);
      expect(unknown.body.message).toBe(`Unknown label "${unknownId}"`);
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

      const { body: labels } = await api.get("/api/labels").set(auth);
      const workId = labels[0].id as string;

      const created = await api
        .post("/api/tasks")
        .set(auth)
        .send({
          title: "Write tests",
          priority: "high",
          dueDate: "2026-11-01",
          labelIds: [workId],
        });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({
        title: "Write tests",
        priority: "high",
        labelIds: [workId],
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
