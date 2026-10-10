import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../../application/AuthService.js";
import { UnauthorizedError } from "../../domain/errors.js";

/** Requires a valid "Authorization: Bearer <token>" header and sets req.user. */
export function createAuthenticate(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Authorization header missing or malformed"));
    }

    try {
      req.user = authService.verifyToken(header.slice("Bearer ".length));
      next();
    } catch (error) {
      next(error);
    }
  };
}
