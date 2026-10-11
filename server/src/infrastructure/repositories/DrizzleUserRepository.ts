import { eq } from "drizzle-orm";
import type { UserRepository } from "../../domain/repositories.js";
import { User, type UserProps } from "../../domain/user.js";
import type { Database } from "../db/client.js";
import { users, type UserRow } from "../db/schema.js";

const toUser = (row: UserRow) =>
  new User({ id: row.id, email: row.email, passwordHash: row.passwordHash });

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async getUserById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? toUser(row) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return row ? toUser(row) : null;
  }

  async createUser(userData: UserProps): Promise<User> {
    const user = new User(userData);
    await this.db.insert(users).values({
      id: user.id,
      email: user.email.address.toLowerCase(),
      passwordHash: user.passwordHash,
    });
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Postgres rejects malformed uuids; treat them as "no such user".
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    const deleted = await this.db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return deleted.length > 0;
  }
}
