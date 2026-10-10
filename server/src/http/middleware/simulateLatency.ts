import type { NextFunction, Request, Response } from "express";

/** Adds a random 0.5–1.5 s delay to every request, to test loading states. */
export function simulateLatency(_req: Request, _res: Response, next: NextFunction): void {
  setTimeout(next, Math.random() * 1000 + 500);
}
