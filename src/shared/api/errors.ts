/** The server answered with a non-2xx status. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown = null,
  ) {
    super(message);
    this.name = "HttpError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

/** The request never got a response (offline, DNS, CORS, timeout). */
export class NetworkError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  return error instanceof Error && error.message ? error.message : fallback;
}
