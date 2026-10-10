import { Router, type RequestHandler } from "express";
import type { TaskService } from "../../application/TaskService.js";
import { validate } from "../middleware/validate.js";
import { toTaskResponse } from "../presenters.js";
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from "../schemas.js";

export function createTasksRouter(taskService: TaskService, authenticate: RequestHandler) {
  const router = Router();
  router.use(authenticate);

  router.get("/", validate(taskQuerySchema, "query"), async (req, res, next) => {
    try {
      const { label } = res.locals.query as { label?: string };
      const tasks = await taskService.getAllTasks(req.user!.userId, label);
      res.json(tasks.map(toTaskResponse));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", validate(createTaskSchema), async (req, res, next) => {
    try {
      const task = await taskService.createTask(req.user!.userId, req.body);
      res.status(201).json(toTaskResponse(task));
    } catch (error) {
      next(error);
    }
  });

  // Patch semantics: only the fields sent are changed.
  router.put("/:id", validate(updateTaskSchema), async (req, res, next) => {
    try {
      const task = await taskService.updateTask(req.user!.userId, String(req.params.id), req.body);
      res.json(toTaskResponse(task));
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
