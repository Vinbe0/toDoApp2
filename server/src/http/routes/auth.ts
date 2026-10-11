import { Router, type RequestHandler } from "express";
import type { AccountService } from "../../application/AccountService.js";
import type { AuthService } from "../../application/AuthService.js";
import { validate } from "../middleware/validate.js";
import { deleteAccountSchema, loginSchema, registerSchema } from "../schemas.js";

/** limitAttempts throttles login/register only, so session checks are never blocked. */
export function createAuthRouter(
  authService: AuthService,
  accountService: AccountService,
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

  // Permanently deletes the signed-in account; the password must be re-entered.
  router.delete(
    "/me",
    limitAttempts,
    authenticate,
    validate(deleteAccountSchema),
    async (req, res, next) => {
      try {
        await accountService.deleteAccount(req.user!.userId, req.body.password);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
