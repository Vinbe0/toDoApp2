/** Only allow redirects to paths inside this app (prevents open redirects). */
export function safeRedirect(value: unknown, fallback = "/todo") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
