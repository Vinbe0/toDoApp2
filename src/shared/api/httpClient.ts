import { HttpError, NetworkError } from "./errors";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpClientOptions = {
  baseUrl: string;
  timeoutMs?: number;
  /** Injected for tests; defaults to the global fetch. */
  fetch?: typeof fetch;
};

export type RequestOptions = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

/**
 * Thin, framework-agnostic wrapper around fetch.
 *
 * Auth is plugged in from the outside (setTokenProvider / onUnauthorized)
 * so this shared layer never depends on a feature module.
 */
export function createHttpClient({
  baseUrl,
  timeoutMs = 15_000,
  fetch: fetchFn,
}: HttpClientOptions) {
  let getToken: () => string | null = () => null;
  let unauthorizedHandler: (() => void) | null = null;

  async function request<T>(
    method: Method,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers = new Headers({ Accept: "application/json", ...options.headers });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await (fetchFn ?? fetch)(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (timeout.aborted) throw new NetworkError("The server took too long to respond", error);
      if (options.signal?.aborted) throw error;
      throw new NetworkError("Can't reach the server. Check your connection.", error);
    }

    const data = await parseBody(response);

    if (!response.ok) {
      if (response.status === 401) unauthorizedHandler?.();
      const message =
        (isRecord(data) && typeof data.message === "string" && data.message) ||
        `Request failed with status ${response.status}`;
      throw new HttpError(message, response.status, data);
    }

    return data as T;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("POST", path, body, options),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PUT", path, body, options),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PATCH", path, body, options),
    delete: <T = void>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, undefined, options),

    setTokenProvider(provider: () => string | null) {
      getToken = provider;
    },
    onUnauthorized(handler: (() => void) | null) {
      unauthorizedHandler = handler;
    },
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
