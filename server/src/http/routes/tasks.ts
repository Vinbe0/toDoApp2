import { Router, type RequestHandler } from "express";
import type { TaskService } from "../../application/TaskService.js";

export function createTasksRouter(taskService: TaskService, authenticate: RequestHandler) {
  const router = Router();
  router.use(authenticate);

  router.get("/", async (req, res, next) => {
    try {
      const label = typeof req.query.label === "string" ? req.query.label : undefined;
      res.json(await taskService.getAllTasks(req.user!.userId, label));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await taskService.createTask(req.user!.userId, req.body));
    } catch (error) {
      next(error);
    }
  });

  // Patch semantics: only the fields sent are changed.
  router.put("/:id", async (req, res, next) => {
    try {
      res.json(await taskService.updateTask(req.user!.userId, String(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      await taskService.deleteTask(req.user!.userId, String(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
