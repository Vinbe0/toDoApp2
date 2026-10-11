import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// Backend
import { AccountService } from "../server/src/application/AccountService.js";
import { AuthService } from "../server/src/application/AuthService.js";
import { LabelService } from "../server/src/application/LabelService.js";
import { TaskService } from "../server/src/application/TaskService.js";
import { createApp } from "../server/src/http/app.js";
import {
  connectDatabase,
  type DatabaseConnection,
} from "../server/src/infrastructure/db/client.js";
import { DrizzleLabelRepository } from "../server/src/infrastructure/repositories/DrizzleLabelRepository.js";
import { DrizzleTaskRepository } from "../server/src/infrastructure/repositories/DrizzleTaskRepository.js";
import { DrizzleUserRepository } from "../server/src/infrastructure/repositories/DrizzleUserRepository.js";
import { BcryptPasswordHasher } from "../server/src/infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "../server/src/infrastructure/security/JwtTokenService.js";
// Frontend
import { createAuthApi } from "@/features/auth/api/authApi";
import { ApiLabelRepository } from "@/features/tasks/repositories/ApiLabelRepository";
import { ApiTaskRepository } from "@/features/tasks/repositories/ApiTaskRepository";
import { createHttpClient, type HttpClient } from "@/shared/api/httpClient";
import { HttpError } from "@/shared/api/errors";

let database: DatabaseConnection;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  database = await connectDatabase({ pgliteDataDir: "memory://" });
  const labelRepository = new DrizzleLabelRepository(database.db);
  const taskRepository = new DrizzleTaskRepository(database.db);
  const labelService = new LabelService(labelRepository, taskRepository);
  const userRepository = new DrizzleUserRepository(database.db);
  const passwordHasher = new BcryptPasswordHasher(4);
  const app = createApp({
    labelService,
    taskService: new TaskService(taskRepository, labelRepository),
    accountService: new AccountService(
      userRepository,
      taskRepository,
      labelRepository,
      passwordHasher,
    ),
    authService: new AuthService(
      userRepository,
      passwordHasher,
      new JwtTokenService("integration-secret"),
      (userId) => labelService.createDefaultLabels(userId),
    ),
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await database.close();
});

/** A signed-in frontend client, wired the same way main.ts wires the app. */
async function signIn(email = `${crypto.randomUUID()}@example.com`) {
  const client: HttpClient = createHttpClient({ baseUrl });
  let token: string | null = null;
  client.setTokenProvider(() => token);

  const auth = createAuthApi(client);
  const session = await auth.register(email, "password123");
  token = session.token;

  const labels = new ApiLabelRepository(client);
  /** Id of one of the account's labels, by name. */
  const labelId = async (name: string) =>
    (await labels.list()).find((label) => label.name === name)!.id;

  return { client, auth, session, tasks: new ApiTaskRepository(client), labels, labelId };
}

describe("frontend ↔ backend", () => {
  it("registers, logs in and restores the session", async () => {
    const { auth, session } = await signIn("Mixed.Case@Example.com");
    expect(session.user.email).toBe("mixed.case@example.com");

    const login = await auth.login("mixed.case@example.com", "password123");
    expect(login.user.id).toBe(session.user.id);
    expect((await auth.me()).user.id).toBe(session.user.id);
  });

  it("round-trips every task field through the API and database", async () => {
    const { tasks, labelId } = await signIn();
    const work = await labelId("Work");
    const university = await labelId("University");

    const created = await tasks.create({
      text: "Write the integration test",
      description: "Frontend repository → Express → Postgres",
      deadline: "2026-11-01",
      priority: "high",
      labelIds: [work, university],
    });

    expect(await tasks.list()).toEqual([
      {
        id: created.id,
        text: "Write the integration test",
        description: "Frontend repository → Express → Postgres",
        deadline: "2026-11-01",
        priority: "high",
        labelIds: [work, university],
        completed: false,
      },
    ]);
  });

  it("updates, reorders and deletes tasks", async () => {
    const { tasks, labelId } = await signIn();
    const shopping = await labelId("Shopping");
    const [a, b, c] = [
      await tasks.create({
        text: "A",
        description: "",
        deadline: null,
        priority: "low",
        labelIds: [],
      }),
      await tasks.create({
        text: "B",
        description: "",
        deadline: null,
        priority: "low",
        labelIds: [],
      }),
      await tasks.create({
        text: "C",
        description: "",
        deadline: null,
        priority: "low",
        labelIds: [],
      }),
    ];

    await tasks.update(a.id, { completed: true, text: "A (done)", labelIds: [shopping] });
    await tasks.reorder([c.id, a.id, b.id]);
    await tasks.remove(b.id);

    const list = await tasks.list();
    expect(list.map((task) => task.text)).toEqual(["C", "A (done)"]);
    expect(list[1]).toMatchObject({ completed: true, labelIds: [shopping] });
  });

  it("manages custom labels, and deleting one removes it from tasks", async () => {
    const { tasks, labels } = await signIn();
    expect((await labels.list()).map((label) => label.name)).toEqual([
      "Work",
      "Shopping",
      "University",
    ]);

    const gym = await labels.create({ name: "Gym", color: "red" });
    const renamed = await labels.update(gym.id, { name: "Fitness", color: "teal" });
    expect(renamed).toEqual({ id: gym.id, name: "Fitness", color: "teal" });

    const task = await tasks.create({
      text: "Run",
      description: "",
      deadline: null,
      priority: "low",
      labelIds: [gym.id],
    });
    await labels.remove(gym.id);

    expect((await tasks.list()).find((t) => t.id === task.id)?.labelIds).toEqual([]);
    const duplicate = await labels.create({ name: "work", color: "sky" }).catch((e) => e);
    expect(duplicate).toMatchObject({ status: 409 });
  });

  it("deletes an account with its data; the old token stops working", async () => {
    const { auth, tasks, labels } = await signIn("leaving@example.com");
    await tasks.create({
      text: "Bye",
      description: "",
      deadline: null,
      priority: "low",
      labelIds: [],
    });

    const wrong = await auth.deleteAccount("wrong-password").catch((e) => e);
    expect(wrong).toMatchObject({ status: 403 });
    expect(await tasks.list()).toHaveLength(1);

    await auth.deleteAccount("password123");

    await expect(tasks.list()).rejects.toMatchObject({ isUnauthorized: true });
    await expect(labels.list()).rejects.toMatchObject({ isUnauthorized: true });
    const login = await auth.login("leaving@example.com", "password123").catch((e) => e);
    expect(login).toMatchObject({ status: 401 });
  });

  it("keeps users' tasks private", async () => {
    const alice = await signIn();
    const bob = await signIn();
    const task = await alice.tasks.create({
      text: "Alice only",
      description: "",
      deadline: null,
      priority: "low",
      labelIds: [],
    });

    expect(await bob.tasks.list()).toEqual([]);
    await expect(bob.tasks.remove(task.id)).rejects.toMatchObject({ status: 404 });
    expect(await alice.tasks.list()).toHaveLength(1);
  });

  it("surfaces server errors as typed HttpErrors", async () => {
    const { auth } = await signIn("taken@example.com");

    const duplicate = await auth.register("taken@example.com", "password123").catch((e) => e);
    expect(duplicate).toBeInstanceOf(HttpError);
    expect(duplicate).toMatchObject({ status: 409 });

    const tooShort = await auth.register("new@example.com", "short").catch((e) => e);
    expect(tooShort).toMatchObject({ status: 400 });

    const anonymous = new ApiTaskRepository(createHttpClient({ baseUrl }));
    await expect(anonymous.list()).rejects.toMatchObject({ isUnauthorized: true });
  });
});
