import type { NextFunction, Request, Response } from "express";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors.js";

function statusFor(error: DomainError): number {
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof ValidationError) return 400;
  return 400;
}

/** Turns thrown errors into JSON responses: { error, message }. */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    res.status(statusFor(err)).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  console.error("[Unhandled error]", err);
  res.status(500).json({
    error: "InternalServerError",
    message: "Something went wrong. Please try again later.",
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
}
