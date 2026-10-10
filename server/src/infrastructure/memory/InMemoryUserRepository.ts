import type { UserRepository } from "../../domain/repositories.js";
import { User, type UserProps } from "../../domain/user.js";

/** Keeps users in process memory, indexed by id and by lowercase email. */
export class InMemoryUserRepository implements UserRepository {
  private usersById = new Map<string, User>();
  private usersByEmail = new Map<string, User>();

  async getUserById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email.toLowerCase()) ?? null;
  }

  async createUser(userData: UserProps): Promise<User> {
    const user = new User(userData);
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email.address.toLowerCase(), user);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.usersById.get(id);
    if (!user) return false;
    this.usersById.delete(id);
    this.usersByEmail.delete(user.email.address.toLowerCase());
    return true;
  }
}
