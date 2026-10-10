import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../../domain/errors.js";

/**
 * Parses req.body (or req.query) with a Zod schema. Valid data replaces the
 * raw input; invalid data becomes a 400 with one entry per problem.
 */
export function validate(schema: ZodTypeAny, source: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || undefined,
        message: issue.message,
      }));
      return next(new ValidationError(details[0]?.message ?? "Invalid request", details));
    }
    if (source === "body") req.body = result.data;
    else res.locals.query = result.data;
    next();
  };
}
