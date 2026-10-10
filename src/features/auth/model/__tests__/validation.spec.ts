import { describe, expect, it } from "vitest";
import { validateCredentials, validateEmail, validatePassword } from "../validation";

describe("validateEmail", () => {
  it.each(["me@example.com", " me@example.co.uk "])("accepts %j", (email) => {
    expect(validateEmail(email)).toBeUndefined();
  });

  it("asks for a missing email", () => {
    expect(validateEmail("  ")).toBe("Enter your email address");
  });

  it.each(["me", "me@", "me@example", "me @example.com"])("rejects %j", (email) => {
    expect(validateEmail(email)).toBe("Enter a valid email address");
  });
});

describe("validatePassword", () => {
  it("requires a password", () => {
    expect(validatePassword("", "login")).toBe("Enter your password");
  });

  it("enforces the minimum length only when registering", () => {
    expect(validatePassword("abc", "login")).toBeUndefined();
    expect(validatePassword("abc", "register")).toBe("Use at least 6 characters");
    expect(validatePassword("abcdef", "register")).toBeUndefined();
  });
});

describe("validateCredentials", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateCredentials({ email: "me@example.com", password: "secret" }, "register"),
    ).toEqual({});
  });

  it("returns an error per invalid field", () => {
    expect(validateCredentials({ email: "nope", password: "" }, "login")).toEqual({
      email: "Enter a valid email address",
      password: "Enter your password",
    });
  });
});
