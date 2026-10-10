import { randomUUID } from "node:crypto";
import { ConflictError, UnauthorizedError, ValidationError } from "../domain/errors.js";
import type { UserRepository } from "../domain/repositories.js";
import type { PasswordHasher, TokenPayload, TokenService } from "./ports.js";

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

/** Registration, login and token verification. */
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    /** Runs after a new account is created, e.g. to give it default labels. */
    private readonly onUserRegistered: (userId: string) => Promise<unknown> = async () => {},
  ) {}

  async register(input: Credentials): Promise<AuthResult> {
    if (!input.email || !input.password) {
      throw new ValidationError("Email and password are required");
    }
    if (input.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    const existingUser = await this.userRepository.getUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const user = await this.userRepository.createUser({
      id: randomUUID(),
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
    });

    await this.onUserRegistered(user.id);
    return this.issueToken(user.id, user.email.address);
  }

  async login(input: Credentials): Promise<AuthResult> {
    const user = await this.userRepository.getUserByEmail(input.email);

    // Same message for unknown email and wrong password, so attackers
    // can't find out which emails have accounts.
    if (!user || !(await this.passwordHasher.verify(input.password, user.passwordHash))) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return this.issueToken(user.id, user.email.address);
  }

  /** The account behind a token; fails if it was deleted after the token was issued. */
  async getCurrentUser(userId: string): Promise<AuthResult["user"]> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new UnauthorizedError("Account no longer exists");
    return { id: user.id, email: user.email.address };
  }

  verifyToken(token: string): TokenPayload {
    return this.tokenService.verify(token);
  }

  private issueToken(userId: string, email: string): AuthResult {
    return { token: this.tokenService.sign({ userId, email }), user: { id: userId, email } };
  }
}
