import { createHttpClient } from "./httpClient";

export { HttpError, NetworkError, getErrorMessage } from "./errors";
export type { HttpClient, RequestOptions } from "./httpClient";

/** App-wide client for the TODOS backend. Auth hooks are attached in main.ts. */
export const http = createHttpClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});
