import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("has sensible development defaults", () => {
    expect(loadConfig({})).toMatchObject({
      nodeEnv: "development",
      port: 3000,
      corsOrigins: ["http://localhost:5173"],
      simulateLatency: false,
    });
  });

  it("parses values from the environment", () => {
    const config = loadConfig({
      PORT: "8080",
      CORS_ORIGIN: "https://todos.example, http://localhost:4173",
      SIMULATE_LATENCY: "true",
    });
    expect(config.port).toBe(8080);
    expect(config.corsOrigins).toEqual(["https://todos.example", "http://localhost:4173"]);
    expect(config.simulateLatency).toBe(true);
  });

  it("never simulates latency outside development", () => {
    expect(loadConfig({ NODE_ENV: "test", SIMULATE_LATENCY: "true" }).simulateLatency).toBe(false);
  });

  it("requires a strong JWT secret in production", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ NODE_ENV: "production", JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
    expect(loadConfig({ NODE_ENV: "production", JWT_SECRET: "x".repeat(32) }).nodeEnv).toBe(
      "production",
    );
  });

  it("rejects an invalid port", () => {
    expect(() => loadConfig({ PORT: "abc" })).toThrow(/PORT/);
  });
});
