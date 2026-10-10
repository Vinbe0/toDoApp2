import { describe, expect, it } from "vitest";
import { ConflictError, UnauthorizedError, ValidationError } from "../domain/errors.js";
import { createTestServices } from "../../test/helpers.js";

const credentials = { email: "me@example.com", password: "password123" };

describe("AuthService", () => {
  it("registers a user and returns a verifiable token", async () => {
    const { authService } = createTestServices();
    const result = await authService.register(credentials);

    expect(result.user.email).toBe("me@example.com");
    expect(authService.verifyToken(result.token)).toEqual({
      userId: result.user.id,
      email: "me@example.com",
    });
  });

  it("never stores the plain password", async () => {
    const { authService, userRepository } = createTestServices();
    await authService.register(credentials);
    const user = await userRepository.getUserByEmail(credentials.email);
    expect(user?.passwordHash).not.toContain(credentials.password);
  });

  it("rejects short passwords", async () => {
    const { authService } = createTestServices();
    await expect(
      authService.register({ email: "me@example.com", password: "short" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a duplicate email regardless of case", async () => {
    const { authService } = createTestServices();
    await authService.register(credentials);
    await expect(
      authService.register({ ...credentials, email: "ME@example.com" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("logs in with the right password", async () => {
    const { authService } = createTestServices();
    await authService.register(credentials);
    await expect(authService.login(credentials)).resolves.toHaveProperty("token");
  });

  it("uses the same error for unknown email and wrong password", async () => {
    const { authService } = createTestServices();
    await authService.register(credentials);

    const wrongPassword = authService.login({ ...credentials, password: "wrong-password" });
    const unknownEmail = authService.login({ ...credentials, email: "other@example.com" });

    await expect(wrongPassword).rejects.toThrow("Invalid email or password");
    await expect(unknownEmail).rejects.toThrow("Invalid email or password");
    await expect(unknownEmail).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects tampered tokens", async () => {
    const { authService } = createTestServices();
    const { token } = await authService.register(credentials);
    expect(() => authService.verifyToken(`${token}x`)).toThrow(UnauthorizedError);
  });
});
