/** Postgres error code for a unique-constraint violation. */
const UNIQUE_VIOLATION = "23505";

/** True if a database error (possibly wrapped by Drizzle) is a unique violation. */
export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && "code" in current && current.code === UNIQUE_VIOLATION) {
      return true;
    }
    current = typeof current === "object" && "cause" in current ? current.cause : undefined;
  }
  return false;
}
