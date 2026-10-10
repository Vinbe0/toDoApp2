import { AuthService } from "./application/AuthService.js";
import { TaskService } from "./application/TaskService.js";
import { loadConfig } from "./config.js";
import { createApp } from "./http/app.js";
import { InMemoryTaskRepository } from "./infrastructure/memory/InMemoryTaskRepository.js";
import { InMemoryUserRepository } from "./infrastructure/memory/InMemoryUserRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";

const config = loadConfig();

// Composition root: the only place that picks concrete implementations.
const taskService = new TaskService(new InMemoryTaskRepository());
const authService = new AuthService(
  new InMemoryUserRepository(),
  new BcryptPasswordHasher(),
  new JwtTokenService(config.jwtSecret, config.jwtExpiresIn),
);

const app = createApp({
  taskService,
  authService,
  corsOrigins: config.corsOrigins,
  simulateLatency: config.simulateLatency,
});

app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`   NODE_ENV: ${config.nodeEnv}`);
  console.log(`   Latency simulation: ${config.simulateLatency ? "ON" : "OFF"}`);
});
