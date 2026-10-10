export const config = {
  port: Number(process.env.PORT ?? 3000),
  // Never commit a real secret; set JWT_SECRET in the environment.
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  simulateLatency:
    process.env.NODE_ENV === "development" && process.env.SIMULATE_LATENCY === "true",
};
