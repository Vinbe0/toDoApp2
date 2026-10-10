import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../application/ports.js";

/** Stores only salted bcrypt hashes, never the password itself. */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  hash(password: string) {
    return bcrypt.hash(password, this.rounds);
  }

  verify(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
