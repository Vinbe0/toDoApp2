import { Router, type RequestHandler } from "express";
import type { LabelService } from "../../application/LabelService.js";
import { validate } from "../middleware/validate.js";
import { toLabelResponse } from "../presenters.js";
import { createLabelSchema, updateLabelSchema } from "../schemas.js";

export function createLabelsRouter(labelService: LabelService, authenticate: RequestHandler) {
  const router = Router();
  router.use(authenticate);

  router.get("/", async (req, res, next) => {
    try {
      const labels = await labelService.listLabels(req.user!.userId);
      res.json(labels.map(toLabelResponse));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", validate(createLabelSchema), async (req, res, next) => {
    try {
      const label = await labelService.createLabel(req.user!.userId, req.body);
      res.status(201).json(toLabelResponse(label));
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", validate(updateLabelSchema), async (req, res, next) => {
    try {
      const label = await labelService.updateLabel(
        req.user!.userId,
        String(req.params.id),
        req.body,
      );
      res.json(toLabelResponse(label));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      await labelService.deleteLabel(req.user!.userId, String(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
