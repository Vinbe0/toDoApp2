/**
 * Creates a demo account with sample tasks, so the app can be tried right away.
 *   npm run db:seed
 * Safe to run more than once: an existing demo account is left untouched.
 */
import { AuthService } from "../application/AuthService.js";
import { TaskService, type CreateTaskInput } from "../application/TaskService.js";
import { loadConfig } from "../config.js";
import { connectDatabase } from "../infrastructure/db/client.js";
import { DrizzleTaskRepository } from "../infrastructure/repositories/DrizzleTaskRepository.js";
import { DrizzleUserRepository } from "../infrastructure/repositories/DrizzleUserRepository.js";
import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "../infrastructure/security/JwtTokenService.js";

const DEMO_ACCOUNT = { email: "demo@example.com", password: "demo-password-123" };

const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const SAMPLE_TASKS: CreateTaskInput[] = [
  { title: "Finish the portfolio README", priority: "high", dueDate: inDays(1), labels: ["work"] },
  { title: "Review pull request #3", priority: "medium", dueDate: inDays(2), labels: ["work"] },
  { title: "Read chapter 4 of Clean Architecture", priority: "low", labels: ["university"] },
  { title: "Buy coffee beans", priority: "low", labels: ["shopping"] },
  { title: "Submit the lab report", priority: "high", dueDate: inDays(-1), labels: ["university"] },
  { title: "Set up the project", priority: "medium", labels: ["work"], completed: true },
];

const config = loadConfig();
const database = await connectDatabase(config.database);
const users = new DrizzleUserRepository(database.db);

try {
  if (await users.getUserByEmail(DEMO_ACCOUNT.email)) {
    console.log(`Demo account ${DEMO_ACCOUNT.email} already exists; nothing to do.`);
  } else {
    const auth = new AuthService(
      users,
      new BcryptPasswordHasher(),
      new JwtTokenService(config.jwtSecret),
    );
    const tasks = new TaskService(new DrizzleTaskRepository(database.db));

    const { user } = await auth.register(DEMO_ACCOUNT);
    for (const task of SAMPLE_TASKS) await tasks.createTask(user.id, task);

    console.log(
      `Created ${DEMO_ACCOUNT.email} (password: ${DEMO_ACCOUNT.password}) with ${SAMPLE_TASKS.length} tasks.`,
    );
  }
} finally {
  await database.close();
}
