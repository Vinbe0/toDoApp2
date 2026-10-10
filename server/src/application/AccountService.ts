import { ForbiddenError, NotFoundError } from "../domain/errors.js";
import type { LabelRepository, TaskRepository, UserRepository } from "../domain/repositories.js";
import type { PasswordHasher } from "./ports.js";

/** Account lifecycle beyond sign-in: currently, deleting an account. */
export class AccountService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly taskRepository: TaskRepository,
    private readonly labelRepository: LabelRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /**
   * Permanently deletes the account and everything it owns. Requires the
   * current password, so a stolen sign-in token alone can't do it.
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new NotFoundError("User", userId);
    if (!(await this.passwordHasher.verify(password, user.passwordHash))) {
      throw new ForbiddenError("Incorrect password");
    }

    // The database would cascade these, but deleting explicitly keeps the
    // rule independent of the storage engine.
    await this.taskRepository.deleteAllTasks(userId);
    await this.labelRepository.deleteAllLabels(userId);
    await this.userRepository.deleteUser(userId);
  }
}
