import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// Backend
import { AuthService } from "../server/src/application/AuthService.js";
import { TaskService } from "../server/src/application/TaskService.js";
import { createApp } from "../server/src/http/app.js";
import {
  connectDatabase,
  type DatabaseConnection,
} from "../server/src/infrastructure/db/client.js";
import { DrizzleTaskRepository } from "../server/src/infrastructure/repositories/DrizzleTaskRepository.js";
import { DrizzleUserRepository } from "../server/src/infrastructure/repositories/DrizzleUserRepository.js";
import { BcryptPasswordHasher } from "../server/src/infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "../server/src/infrastructure/security/JwtTokenService.js";
// Frontend
import { createAuthApi } from "@/features/auth/api/authApi";
import { ApiTaskRepository } from "@/features/tasks/repositories/ApiTaskRepository";
import { createHttpClient, type HttpClient } from "@/shared/api/httpClient";
import { HttpError } from "@/shared/api/errors";

let database: DatabaseConnection;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  database = await connectDatabase({ pgliteDataDir: "memory://" });
  const app = createApp({
    taskService: new TaskService(new DrizzleTaskRepository(database.db)),
    authService: new AuthService(
      new DrizzleUserRepository(database.db),
      new BcryptPasswordHasher(4),
      new JwtTokenService("integration-secret"),
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

  return { client, auth, session, tasks: new ApiTaskRepository(client) };
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
    const { tasks } = await signIn();

    const created = await tasks.create({
      text: "Write the integration test",
      description: "Frontend repository → Express → Postgres",
      deadline: "2026-11-01",
      priority: "high",
      labels: ["work", "university"],
    });

    expect(await tasks.list()).toEqual([
      {
        id: created.id,
        text: "Write the integration test",
        description: "Frontend repository → Express → Postgres",
        deadline: "2026-11-01",
        priority: "high",
        labels: ["work", "university"],
        completed: false,
      },
    ]);
  });

  it("updates, reorders and deletes tasks", async () => {
    const { tasks } = await signIn();
    const [a, b, c] = [
      await tasks.create({
        text: "A",
        description: "",
        deadline: null,
        priority: "low",
        labels: [],
      }),
      await tasks.create({
        text: "B",
        description: "",
        deadline: null,
        priority: "low",
        labels: [],
      }),
      await tasks.create({
        text: "C",
        description: "",
        deadline: null,
        priority: "low",
        labels: [],
      }),
    ];

    await tasks.update(a.id, { completed: true, text: "A (done)", labels: ["shopping"] });
    await tasks.reorder([c.id, a.id, b.id]);
    await tasks.remove(b.id);

    const list = await tasks.list();
    expect(list.map((task) => task.text)).toEqual(["C", "A (done)"]);
    expect(list[1]).toMatchObject({ completed: true, labels: ["shopping"] });
  });

  it("keeps users' tasks private", async () => {
    const alice = await signIn();
    const bob = await signIn();
    const task = await alice.tasks.create({
      text: "Alice only",
      description: "",
      deadline: null,
      priority: "low",
      labels: [],
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
