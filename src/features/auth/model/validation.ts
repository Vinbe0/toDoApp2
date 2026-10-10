export type AuthMode = "login" | "register";
export type Credentials = { email: string; password: string };
export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Enter your email address";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address";
}

export function validatePassword(password: string, mode: AuthMode): string | undefined {
  if (!password) return "Enter your password";
  // Existing accounts may predate the length rule, so only enforce it on sign-up.
  if (mode === "register" && password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
}

/** Returns an error per invalid field; an empty object means the form is valid. */
export function validateCredentials(values: Credentials, mode: AuthMode): CredentialErrors {
  const errors: CredentialErrors = {};
  const email = validateEmail(values.email);
  const password = validatePassword(values.password, mode);
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}
