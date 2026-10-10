import { Router } from "express";
import type { AuthService } from "../../application/AuthService.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas.js";

export function createAuthRouter(authService: AuthService) {
  const router = Router();

  router.post("/register", validate(registerSchema), async (req, res, next) => {
    try {
      res.status(201).json(await authService.register(req.body));
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
      res.json(await authService.login(req.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
