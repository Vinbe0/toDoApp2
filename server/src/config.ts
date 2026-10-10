import { z } from "zod";

const DEV_SECRET = "dev-secret-change-in-production";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    JWT_SECRET: z.string().default(DEV_SECRET),
    JWT_EXPIRES_IN: z.string().default("7d"),
    /** Comma-separated list of origins allowed to call the API from a browser. */
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    /** postgres://… — when unset, an embedded PGlite database is used instead. */
    DATABASE_URL: z.string().url().optional(),
    PGLITE_DATA_DIR: z.string().default(".data/pglite"),
    SIMULATE_LATENCY: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .superRefine((env, ctx) => {
    if (
      env.NODE_ENV === "production" &&
      (env.JWT_SECRET === DEV_SECRET || env.JWT_SECRET.length < 32)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "must be set to a random string of at least 32 characters in production",
      });
    }
  });

export type Config = ReturnType<typeof loadConfig>;

/** Reads and validates environment variables. Fails fast with a readable message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join("\n")}`);
  }

  const parsed = result.data;
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    jwtSecret: parsed.JWT_SECRET,
    jwtExpiresIn: parsed.JWT_EXPIRES_IN,
    database: parsed.DATABASE_URL
      ? { url: parsed.DATABASE_URL }
      : { pgliteDataDir: parsed.PGLITE_DATA_DIR },
    corsOrigins: parsed.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    // Only ever slow down requests in development.
    simulateLatency: parsed.NODE_ENV === "development" && parsed.SIMULATE_LATENCY,
  };
}
