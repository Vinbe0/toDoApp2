import type { NextFunction, Request, Response } from "express";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors.js";

function statusFor(error: DomainError): number {
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
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
      ...(err instanceof ValidationError && err.details.length ? { details: err.details } : {}),
    });
    return;
  }

  // Malformed JSON or an oversized body, reported by express.json().
  if (isBodyParserError(err)) {
    res.status(err.status).json({ error: "BadRequest", message: "Request body is not valid JSON" });
    return;
  }

  console.error("[Unhandled error]", err);
  res.status(500).json({
    error: "InternalServerError",
    message: "Something went wrong. Please try again later.",
  });
}

function isBodyParserError(err: Error): err is Error & { status: number } {
  return "type" in err && "status" in err && typeof err.status === "number" && err.status < 500;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
}
