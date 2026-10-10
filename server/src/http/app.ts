import cors from "cors";
import express from "express";
import type { AuthService } from "../application/AuthService.js";
import type { TaskService } from "../application/TaskService.js";
import { createAuthenticate } from "./middleware/authenticate.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { simulateLatency } from "./middleware/simulateLatency.js";
import { createAuthRouter } from "./routes/auth.js";
import { createTasksRouter } from "./routes/tasks.js";

export type AppDependencies = {
  taskService: TaskService;
  authService: AuthService;
  simulateLatency?: boolean;
};

/** Builds the Express app from its dependencies, so tests can pass in fakes. */
export function createApp({ taskService, authService, simulateLatency: slow }: AppDependencies) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  if (slow) app.use(simulateLatency);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/tasks", createTasksRouter(taskService, createAuthenticate(authService)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
