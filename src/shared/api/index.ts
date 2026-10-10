import { createHttpClient } from "./httpClient";

export { HttpError, NetworkError, getErrorMessage } from "./errors";
export type { HttpClient, RequestOptions } from "./httpClient";

/**
 * App-wide client for the TODOS backend. Auth hooks are attached in main.ts.
 * Without VITE_API_URL, requests go to the same origin (the Vite dev proxy).
 */
export const http = createHttpClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "",
});
