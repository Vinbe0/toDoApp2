import { Router, type RequestHandler } from "express";
import type { AuthService } from "../../application/AuthService.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas.js";

/** limitAttempts throttles login/register only, so session checks are never blocked. */
export function createAuthRouter(
  authService: AuthService,
  authenticate: RequestHandler,
  limitAttempts: RequestHandler,
) {
  const router = Router();

  router.post("/register", limitAttempts, validate(registerSchema), async (req, res, next) => {
    try {
      res.status(201).json(await authService.register(req.body));
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", limitAttempts, validate(loginSchema), async (req, res, next) => {
    try {
      res.json(await authService.login(req.body));
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", authenticate, async (req, res, next) => {
    try {
      res.json({ user: await authService.getCurrentUser(req.user!.userId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
