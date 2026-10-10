/** Infrastructure the application layer needs, described as interfaces. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export type TokenPayload = { userId: string; email: string };

export interface TokenService {
  sign(payload: TokenPayload): string;
  /** Throws UnauthorizedError when the token is invalid or expired. */
  verify(token: string): TokenPayload;
}
