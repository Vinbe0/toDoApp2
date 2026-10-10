import { describe, expect, it, vi } from "vitest";
import { createHttpClient } from "../httpClient";
import { HttpError, NetworkError } from "../errors";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function setup(response: Response | (() => Promise<Response>)) {
  const fetchMock = vi.fn<typeof fetch>(
    typeof response === "function" ? response : async () => response,
  );
  const client = createHttpClient({ baseUrl: "https://api.test", fetch: fetchMock, timeoutMs: 50 });
  const lastRequest = () => {
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    return { url, init: init!, headers: init!.headers as Headers };
  };
  return { client, fetchMock, lastRequest };
}

describe("createHttpClient", () => {
  it("prefixes the base URL and parses JSON", async () => {
    const { client, lastRequest } = setup(jsonResponse([{ id: 1 }]));

    await expect(client.get("/api/tasks")).resolves.toEqual([{ id: 1 }]);
    expect(lastRequest().url).toBe("https://api.test/api/tasks");
    expect(lastRequest().init.method).toBe("GET");
  });

  it("serializes the body and sets the JSON content type", async () => {
    const { client, lastRequest } = setup(jsonResponse({ id: 1 }, 201));

    await client.post("/api/tasks", { title: "Ship" });
    expect(lastRequest().init.body).toBe('{"title":"Ship"}');
    expect(lastRequest().headers.get("Content-Type")).toBe("application/json");
  });

  it("adds the bearer token from the provider", async () => {
    const { client, lastRequest } = setup(jsonResponse({}));
    client.setTokenProvider(() => "secret");

    await client.get("/me");
    expect(lastRequest().headers.get("Authorization")).toBe("Bearer secret");
  });

  it("returns null for 204 No Content", async () => {
    const { client } = setup(new Response(null, { status: 204 }));
    await expect(client.delete("/api/tasks/1")).resolves.toBeNull();
  });

  it("throws HttpError with the server message", async () => {
    const { client } = setup(jsonResponse({ message: "Email already used" }, 409));

    const error = await client.post("/register", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 409, message: "Email already used" });
  });

  it("falls back to a generic message when the body has none", async () => {
    const { client } = setup(new Response("oops", { status: 500 }));
    await expect(client.get("/x")).rejects.toThrow("Request failed with status 500");
  });

  it("calls the unauthorized handler on 401", async () => {
    const { client } = setup(jsonResponse({ message: "Token expired" }, 401));
    const onUnauthorized = vi.fn();
    client.onUnauthorized(onUnauthorized);

    await expect(client.get("/api/tasks")).rejects.toMatchObject({ isUnauthorized: true });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("wraps connection failures in NetworkError", async () => {
    const { client } = setup(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(client.get("/x")).rejects.toBeInstanceOf(NetworkError);
  });

  it("times out slow requests", async () => {
    const { client } = setup(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 100);
        }),
    );
    await expect(client.get("/slow")).rejects.toThrow("took too long");
  });
});
