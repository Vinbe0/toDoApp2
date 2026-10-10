import { AuthService } from "./application/AuthService.js";
import { TaskService } from "./application/TaskService.js";
import { loadConfig } from "./config.js";
import { createApp } from "./http/app.js";
import { connectDatabase } from "./infrastructure/db/client.js";
import { DrizzleTaskRepository } from "./infrastructure/repositories/DrizzleTaskRepository.js";
import { DrizzleUserRepository } from "./infrastructure/repositories/DrizzleUserRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";

const config = loadConfig();
const database = await connectDatabase(config.database);

// Composition root: the only place that picks concrete implementations.
const taskService = new TaskService(new DrizzleTaskRepository(database.db));
const authService = new AuthService(
  new DrizzleUserRepository(database.db),
  new BcryptPasswordHasher(),
  new JwtTokenService(config.jwtSecret, config.jwtExpiresIn),
);

const app = createApp({
  taskService,
  authService,
  corsOrigins: config.corsOrigins,
  simulateLatency: config.simulateLatency,
});

const server = app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`   NODE_ENV: ${config.nodeEnv}`);
  console.log(
    `   Database: ${database.driver === "postgres" ? "PostgreSQL" : `PGlite (${"pgliteDataDir" in config.database ? config.database.pgliteDataDir : ""})`}`,
  );
  console.log(`   Latency simulation: ${config.simulateLatency ? "ON" : "OFF"}`);
});

// Finish in-flight requests and close the database on shutdown.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void database.close().then(() => process.exit(0));
    });
  });
}
