import type { TokenPayload } from "../application/ports.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware. */
      user?: TokenPayload;
    }
  }
}
