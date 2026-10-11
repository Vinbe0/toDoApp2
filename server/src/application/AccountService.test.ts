import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "../domain/errors.js";
import { createTestServices } from "../../test/helpers.js";

const credentials = { email: "me@example.com", password: "password123" };

describe("AccountService", () => {
  async function setup() {
    const services = createTestServices();
    const { user } = await services.authService.register(credentials);
    await services.taskService.createTask(user.id, { title: "Mine" });
    return { ...services, userId: user.id };
  }

  it("deletes the user with their tasks and labels", async () => {
    const { accountService, userRepository, taskRepository, labelRepository, userId } =
      await setup();

    await accountService.deleteAccount(userId, credentials.password);

    expect(await userRepository.getUserById(userId)).toBeNull();
    expect(await taskRepository.getAllTasks(userId)).toEqual([]);
    expect(await labelRepository.listLabels(userId)).toEqual([]);
  });

  it("requires the correct password and keeps everything otherwise", async () => {
    const { accountService, userRepository, taskRepository, userId } = await setup();

    await expect(accountService.deleteAccount(userId, "wrong-password")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(await userRepository.getUserById(userId)).not.toBeNull();
    expect(await taskRepository.getAllTasks(userId)).toHaveLength(1);
  });

  it("leaves other accounts alone", async () => {
    const { accountService, authService, taskService, userId } = await setup();
    const { user: other } = await authService.register({
      ...credentials,
      email: "other@example.com",
    });
    await taskService.createTask(other.id, { title: "Theirs" });

    await accountService.deleteAccount(userId, credentials.password);
    expect((await taskService.getAllTasks(other.id)).map((t) => t.title)).toEqual(["Theirs"]);
  });

  it("reports an unknown account", async () => {
    const { accountService } = createTestServices();
    await expect(accountService.deleteAccount("nobody", "x")).rejects.toBeInstanceOf(NotFoundError);
  });
});
