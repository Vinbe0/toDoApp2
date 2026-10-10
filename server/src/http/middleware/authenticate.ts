import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../../application/AuthService.js";
import { UnauthorizedError } from "../../domain/errors.js";

/**
 * Requires a valid "Authorization: Bearer <token>" header for an account
 * that still exists, and sets req.user.
 */
export function createAuthenticate(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Authorization header missing or malformed"));
    }

    try {
      req.user = await authService.authenticate(header.slice("Bearer ".length));
      next();
    } catch (error) {
      next(error);
    }
  };
}
