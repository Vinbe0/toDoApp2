import request from "supertest";
import { AuthService } from "../src/application/AuthService.js";
import { LabelService } from "../src/application/LabelService.js";
import { TaskService } from "../src/application/TaskService.js";
import { createApp } from "../src/http/app.js";
import { InMemoryLabelRepository } from "../src/infrastructure/memory/InMemoryLabelRepository.js";
import { InMemoryTaskRepository } from "../src/infrastructure/memory/InMemoryTaskRepository.js";
import { InMemoryUserRepository } from "../src/infrastructure/memory/InMemoryUserRepository.js";
import { BcryptPasswordHasher } from "../src/infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "../src/infrastructure/security/JwtTokenService.js";

export const TEST_SECRET = "test-secret";

/** Services wired with in-memory storage and a fast password hasher. */
export function createTestServices() {
  const taskRepository = new InMemoryTaskRepository();
  const userRepository = new InMemoryUserRepository();
  const labelRepository = new InMemoryLabelRepository();
  const tokenService = new JwtTokenService(TEST_SECRET);
  const labelService = new LabelService(labelRepository);
  return {
    taskRepository,
    userRepository,
    labelRepository,
    tokenService,
    labelService,
    taskService: new TaskService(taskRepository),
    authService: new AuthService(userRepository, new BcryptPasswordHasher(4), tokenService, (id) =>
      labelService.createDefaultLabels(id),
    ),
  };
}

export function createTestApp() {
  const services = createTestServices();
  const app = createApp(services);
  const api = request(app);

  /** Registers a user and returns an Authorization header for them. */
  async function signUp(email = `user-${crypto.randomUUID()}@example.com`) {
    const res = await api.post("/api/auth/register").send({ email, password: "password123" });
    return {
      email,
      token: res.body.token as string,
      auth: { Authorization: `Bearer ${res.body.token}` },
    };
  }

  return { app, api, signUp, ...services };
}
