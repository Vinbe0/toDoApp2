import jwt from "jsonwebtoken";
import type { TokenPayload, TokenService } from "../../application/ports.js";
import { UnauthorizedError } from "../../domain/errors.js";

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    /** e.g. "7d", "12h"; see the jsonwebtoken docs for the format. */
    private readonly expiresIn = "7d",
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as NonNullable<jwt.SignOptions["expiresIn"]>,
    });
  }

  verify(token: string): TokenPayload {
    try {
      const { userId, email } = jwt.verify(token, this.secret) as TokenPayload;
      return { userId, email };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
