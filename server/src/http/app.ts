import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { AuthService } from "../application/AuthService.js";
import type { LabelService } from "../application/LabelService.js";
import type { TaskService } from "../application/TaskService.js";
import { createAuthenticate } from "./middleware/authenticate.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { simulateLatency } from "./middleware/simulateLatency.js";
import { createAuthRouter } from "./routes/auth.js";
import { createLabelsRouter } from "./routes/labels.js";
import { createTasksRouter } from "./routes/tasks.js";

export type AppDependencies = {
  taskService: TaskService;
  authService: AuthService;
  labelService: LabelService;
  /** Browser origins allowed by CORS. Omit to allow any origin (tests). */
  corsOrigins?: string[];
  /** Max auth requests per IP per 15 minutes. */
  authRateLimit?: number;
  simulateLatency?: boolean;
};

/** Builds the Express app from its dependencies, so tests can pass in fakes. */
export function createApp({
  taskService,
  authService,
  labelService,
  corsOrigins,
  authRateLimit = 20,
  simulateLatency: slow,
}: AppDependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined));
  app.use(express.json({ limit: "100kb" }));
  if (slow) app.use(simulateLatency);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Slow down password guessing.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authRateLimit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "TooManyRequests", message: "Too many attempts. Try again later." },
  });
  const authenticate = createAuthenticate(authService);
  app.use("/api/auth", createAuthRouter(authService, authenticate, authLimiter));
  app.use("/api/tasks", createTasksRouter(taskService, authenticate));
  app.use("/api/labels", createLabelsRouter(labelService, authenticate));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
