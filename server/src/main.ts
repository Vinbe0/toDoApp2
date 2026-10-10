// backend/main.ts
/**
 * Полный пример Express-сервера для Todo-приложения.
 *
 * Структура файла (читай сверху вниз — каждый слой строится на предыдущем):
 *
 *   1. НАСТРОЙКА EXPRESS  — app, middleware, переменные окружения
 *   2. DOMAIN             — бизнес-сущности (Task, User, Email) и интерфейсы репозиториев
 *   3. INFRASTRUCTURE     — конкретные реализации репозиториев (in-memory)
 *   4. APPLICATION        — сервисы: TaskService, AuthService
 *   5. API                — HTTP-роуты, middleware аутентификации, обработка ошибок
 *   6. BOOTSTRAP          — сборка всего вместе и запуск сервера
 *
 * В реальном проекте каждый раздел — это отдельная папка и набор файлов.
 * Здесь всё в одном файле, чтобы ты видел полную картину без прыжков между файлами.
 *
 * Для запуска нужно установить зависимости:
 *   npm install express cors jsonwebtoken bcryptjs
 *   npm install -D @types/express @types/cors @types/jsonwebtoken @types/bcryptjs typescript
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto"; // встроен в Node.js >= 14.17, ничего устанавливать не нужно

// ============================================================
// === 1. НАСТРОЙКА EXPRESS ===================================
// ============================================================

const app = express();
const PORT = process.env.PORT ?? 3000;

// JWT_SECRET — секретный ключ для подписи токенов.
// В продакшне это длинная случайная строка из переменных окружения (.env).
// Никогда не коммить реальный секрет в git — добавь .env в .gitignore.
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

app.use(cors());
app.use(express.json());

// Симуляция задержки сети в режиме разработки.
// Запускается только если обе переменные окружения выставлены явно —
// случайно включить в продакшне невозможно.
if (
  process.env.NODE_ENV === "development" &&
  process.env.SIMULATE_LATENCY === "true"
) {
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    const delay = Math.random() * 1000 + 500;
    setTimeout(next, delay);
  });
}

// ============================================================
// === 2. DOMAIN LAYER ========================================
// ============================================================
//
// Доменный слой — сердце приложения. Здесь живут все бизнес-правила.
// Этот слой не знает ничего ни о Express, ни о базах данных, ни о HTTP.
// Он мог бы работать в CLI, в тестах, в воркере — где угодно.

type Priority = "low" | "medium" | "high";
type Label = "work" | "shopping" | "university";
const ALLOWED_LABELS: Label[] = ["work", "shopping", "university"];

interface TaskProps {
  id: string;
  title: string;
  position: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  label?: Label;
  completed?: boolean;
}

class Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  label: Label;
  completed: boolean;
  /** Лексикографическая позиция в списке. Используется для сортировки. */
  position: string;

  constructor({
    id,
    title,
    position,
    description = "",
    dueDate = null,
    priority = "low",
    label = "work",
    completed = false,
  }: TaskProps) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.label = label;
    this.completed = completed;
    this.position = position;
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim() === "") {
      throw new Error("Task title cannot be empty");
    }
    if (this.dueDate && isNaN(Date.parse(this.dueDate))) {
      throw new Error(
        "Invalid due date. Expected a valid date string or null.",
      );
    }
    if (!(["low", "medium", "high"] as Priority[]).includes(this.priority)) {
      throw new Error(
        'Invalid priority level. Expected "low", "medium", or "high".',
      );
    }
    if (!ALLOWED_LABELS.includes(this.label)) {
      throw new Error(
        'Invalid label. Expected "work", "shopping", or "university".',
      );
    }
  }

  toggleCompletion(): void {
    this.completed = !this.completed;
  }
}

// Email — Value Object. Инкапсулирует логику валидации адреса.
// Если завтра понадобится более строгая проверка (regex) — меняешь
// только этот класс, всё остальное остаётся нетронутым.
class Email {
  readonly address: string;

  constructor(address: string) {
    this.address = address;
    this.validate();
  }

  private validate(): void {
    // Простая проверка для учебного примера.
    // В продакшне используй библиотеку validator.js или RFC 5322 regex.
    if (!this.address || !this.address.includes("@")) {
      throw new Error("Invalid email address");
    }
  }
}

interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
}

class User {
  id: string;
  email: Email;
  passwordHash: string;

  constructor({ id, email, passwordHash }: UserProps) {
    this.id = id;
    this.email = new Email(email);
    this.passwordHash = passwordHash;
  }
}

// --- Интерфейсы репозиториев ---
//
// Контракты: описывают ЧТО умеет делать репозиторий, но не КАК.
// Всё что выше работает с интерфейсом — не знает про конкретную реализацию.
// Сегодня in-memory, завтра PostgreSQL — меняешь одну строку в bootstrap-секции.

interface ITaskRepository {
  getAllTasks(userId: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(taskData: TaskProps & { userId: string }): Promise<Task>;
  updateTask(id: string, updatedData: Partial<TaskProps>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
}

interface IUserRepository {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: UserProps): Promise<User>;
}

// ============================================================
// === 3. INFRASTRUCTURE LAYER ================================
// ============================================================
//
// Конкретные реализации репозиториев. Здесь можно знать про
// базы данных, файлы, внешние API — всё что угодно.
// Доменный слой об этом ничего не знает и знать не должен.

/**
 * InMemoryTaskRepository — хранит задачи в оперативной памяти.
 *
 * Map<string, Task> — структура "ключ → значение", ключ это id задачи.
 *
 * Почему Map, а не Array?
 *   - Поиск по id в Array: O(n) — нужно перебрать все элементы
 *   - Поиск по ключу в Map: O(1) — мгновенно, как lookup в словаре
 *
 * Почему методы async, если никакой сети нет?
 *   Потому что ITaskRepository объявляет их как async. Это позволяет
 *   заменить InMemoryTaskRepository на PostgresTaskRepository (где async
 *   нужна по-настоящему) без изменения кода выше. Единый интерфейс.
 *
 * Важно: данные живут только пока работает сервер. При перезапуске — сброс.
 * Это нормально для тестов и прототипов, но не для продакшна.
 */
class InMemoryTaskRepository implements ITaskRepository {
  // Map параметризован — TypeScript знает что ключ string, значение Task.
  // Попытка положить туда число вызовет ошибку компиляции.
  private tasks = new Map<string, Task>();

  // userId → Set<taskId> — вторичный индекс.
  // Позволяет быстро получить все задачи конкретного пользователя
  // без перебора всего tasks-хранилища.
  // В реальной БД это аналог поля user_id с индексом в таблице tasks.
  private userTaskIndex = new Map<string, Set<string>>();

  async getAllTasks(userId: string): Promise<Task[]> {
    const taskIds = this.userTaskIndex.get(userId) ?? new Set<string>();
    return Array.from(taskIds)
      .map((id) => this.tasks.get(id)!)
      .sort((a, b) => a.position.localeCompare(b.position));
  }

  async getTaskById(id: string): Promise<Task | null> {
    // Map.get возвращает undefined если ключа нет.
    // ?? null конвертирует undefined → null, как объявлено в интерфейсе.
    return this.tasks.get(id) ?? null;
  }

  async createTask(taskData: TaskProps & { userId: string }): Promise<Task> {
    const task = new Task(taskData);
    this.tasks.set(task.id, task);

    // Добавляем id задачи в индекс пользователя
    if (!this.userTaskIndex.has(taskData.userId)) {
      this.userTaskIndex.set(taskData.userId, new Set());
    }
    this.userTaskIndex.get(taskData.userId)!.add(task.id);

    return task;
  }

  async updateTask(
    id: string,
    updatedData: Partial<TaskProps>,
  ): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (!task) return null;

    // Object.assign мутирует task, копируя в него все поля из updatedData.
    // Partial<TaskProps> позволяет передать только те поля что нужно обновить
    // (patch-семантика). Остальные поля остаются без изменений.
    Object.assign(task, updatedData);
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const existed = this.tasks.has(id);
    this.tasks.delete(id);

    // Чистим вторичный индекс — иначе будет утечка памяти.
    // В реальной БД это делается через CASCADE DELETE.
    for (const taskIds of this.userTaskIndex.values()) {
      taskIds.delete(id);
    }

    return existed;
  }
}

/**
 * InMemoryUserRepository — два индекса: по id и по email.
 *
 * Почему два?
 *   - getUserById    → используется при валидации JWT (id есть в токене)
 *   - getUserByEmail → используется при логине (пользователь вводит email)
 *
 * Оба lookup O(1) — Map быстрее чем Array.find().
 */
class InMemoryUserRepository implements IUserRepository {
  private usersById = new Map<string, User>();
  private usersByEmail = new Map<string, User>();

  async getUserById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Нормализуем к lowercase: "User@Mail.com" и "user@mail.com" — один аккаунт.
    return this.usersByEmail.get(email.toLowerCase()) ?? null;
  }

  async createUser(userData: UserProps): Promise<User> {
    const user = new User(userData);
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email.address.toLowerCase(), user);
    return user;
  }
}

// ============================================================
// === 4. APPLICATION LAYER ===================================
// ============================================================
//
// Application Layer — оркестратор. Знает про домен и репозитории,
// но не знает про HTTP. Здесь реализуются "use cases" приложения.
//
// Use case — сценарий использования: "пользователь создаёт задачу",
// "пользователь входит в аккаунт" и т.д.
//
// Если завтра добавится CLI или WebSocket — они используют те же
// сервисы, не дублируя логику.

// --- Типизированные ошибки ---
//
// Вместо везде бросать new Error("...") и потом угадывать что пошло не так —
// создаём иерархию ошибок. Каждый тип несёт свой HTTP-код.
//
// Паттерн "typed errors": ошибки как часть контракта системы.
// Глобальный error handler потом читает statusCode и отвечает клиенту правильным кодом.

class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name; // "NotFoundError", "ValidationError" — попадёт в логи
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// --- TaskService ---
//
// Use cases: создать задачу, получить все, обновить, удалить.
// Принимает репозиторий через конструктор (Dependency Injection) —
// легко подменить на мок в тестах без поднятия реального сервера.

interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  label?: Label;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  label?: Label;
  completed?: boolean;
  position?: string;
}

class TaskService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async getAllTasks(userId: string, label?: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getAllTasks(userId);
    if (!label) return tasks;
    if (!ALLOWED_LABELS.includes(label as Label)) {
      throw new ValidationError(
        'Invalid label filter. Expected "work", "shopping", or "university".',
      );
    }
    return tasks.filter((task) => task.label === label);
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    if (!input.title?.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }

    // Генерируем лексикографическую позицию для новой задачи.
    // Берём все задачи, находим максимальную позицию, "шагаем" дальше.
    // Упрощённый fractional indexing — в продакшне используй библиотеку
    // вроде "fractional-indexing" для корректной вставки в середину списка.
    const existingTasks = await this.taskRepository.getAllTasks(userId);
    const lastPosition = existingTasks.at(-1)?.position ?? "a0";
    const newPosition = TaskService.incrementPosition(lastPosition);

    return this.taskRepository.createTask({
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description ?? "",
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? "low",
      label: input.label ?? "work",
      completed: false,
      position: newPosition,
      userId,
    });
  }

  async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) throw new NotFoundError("Task", taskId);
    if (input.title !== undefined && !input.title.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }
    if (input.label !== undefined && !ALLOWED_LABELS.includes(input.label)) {
      throw new ValidationError(
        'Invalid label. Expected "work", "shopping", or "university".',
      );
    }

    // В продакшне здесь нужна проверка владельца: task.userId === userId.
    // Без неё один пользователь может изменить задачи другого.
    // Для упрощения примера опускаем (в InMemory-репозитории нет поля userId на задаче).

    const updated = await this.taskRepository.updateTask(taskId, input);
    return updated!;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) throw new NotFoundError("Task", taskId);

    await this.taskRepository.deleteTask(taskId);
  }

  // Упрощённый инкремент позиции: "a0" → "a1", "a9" → "b0".
  // Позволяет добавлять задачи в конец без пересчёта всего списка.
  private static incrementPosition(pos: string): string {
    const letter = pos[0];
    const num = parseInt(pos.slice(1), 10);
    if (num < 9) return `${letter}${num + 1}`;
    return `${String.fromCharCode(letter.charCodeAt(0) + 1)}0`;
  }
}

// --- AuthService ---
//
// Use cases: регистрация и вход.
// Работает с bcrypt (хеширование паролей) и jwt (токены).

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

class AuthService {
  // BCRYPT_ROUNDS — "стоимость" хеширования (work factor).
  // Чем выше — тем дольше вычисляется хеш, тем сложнее брутфорс.
  // 10-12 — стандарт для продакшна (баланс между безопасностью и скоростью).
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(private readonly userRepository: IUserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (!input.email || !input.password) {
      throw new ValidationError("Email and password are required");
    }
    if (input.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    const existingUser = await this.userRepository.getUserByEmail(input.email);
    if (existingUser) {
      // Нюанс безопасности: сообщение "такой email занят" позволяет перебором
      // узнать зарегистрированные аккаунты (user enumeration attack).
      // В высокозащищённых системах возвращают одинаковый ответ для обоих случаев.
      // Здесь показываем явное сообщение для читаемости кода.
      throw new ConflictError("User with this email already exists");
    }

    // bcrypt.hash — хешируем пароль перед сохранением в БД.
    // В базе НИКОГДА не хранится сам пароль — только его хеш.
    // Это значит: даже если БД утечёт — пароли пользователей не скомпрометированы.
    // При логине: bcrypt.compare(введённый_пароль, хеш_из_бд) → true/false.
    const passwordHash = await bcrypt.hash(
      input.password,
      AuthService.BCRYPT_ROUNDS,
    );

    const user = await this.userRepository.createUser({
      id: randomUUID(),
      email: input.email,
      passwordHash,
    });

    const token = this.generateToken(user);
    return { token, user: { id: user.id, email: user.email.address } };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.getUserByEmail(input.email);

    // Намеренно одинаковое сообщение для "нет такого email" и "неверный пароль".
    // Это защита от user enumeration — нельзя понять, существует ли аккаунт.
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = this.generateToken(user);
    return { token, user: { id: user.id, email: user.email.address } };
  }

  verifyToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch {
      // jwt.verify бросает разные ошибки: TokenExpiredError, JsonWebTokenError.
      // Мы оборачиваем их в наш UnauthorizedError с единым сообщением.
      throw new UnauthorizedError("Invalid or expired token");
    }
  }

  private generateToken(user: User): string {
    // jwt.sign создаёт токен: payload подписывается секретным ключом.
    // Payload виден всем (base64), но подделать подпись без знания секрета нельзя.
    // expiresIn: '7d' — токен истекает через 7 дней (security best practice).
    return jwt.sign(
      { userId: user.id, email: user.email.address },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
  }
}

// ============================================================
// === 5. API LAYER ============================================
// ============================================================
//
// Здесь Express снова появляется на сцене. API-слой знает про HTTP:
// читает req.body, req.params, выставляет статус-коды,
// конвертирует AppError → JSON-ответ клиенту.

// --- Расширение типов Express ---
//
// По умолчанию req.user не существует в типах Express.
// Мы расширяем interface Request через module augmentation чтобы
// TypeScript знал: после authenticateMiddleware на req.user есть объект.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

// --- Middleware аутентификации ---
//
// Стоит перед защищёнными роутами. Читает JWT из заголовка,
// верифицирует, кладёт данные в req.user.
//
// Схема: Authorization: Bearer <token>  (RFC 6750)
// "Bearer" — тип аутентификационной схемы. Слово зарезервировано стандартом.

function createAuthMiddleware(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      // next(error) вместо res.status(401).json(...) — передаём в глобальный handler.
      // Так логика ответа на ошибки централизована в одном месте.
      return next(
        new UnauthorizedError("Authorization header missing or malformed"),
      );
    }

    const token = authHeader.slice(7); // убираем "Bearer " (7 символов)
    try {
      req.user = authService.verifyToken(token);
      next(); // всё хорошо — передаём управление следующему обработчику
    } catch (error) {
      next(error); // токен невалидный — передаём UnauthorizedError дальше
    }
  };
}

// --- Роутер задач ---
//
// express.Router() — мини-приложение со своими роутами.
// Монтируется в основное приложение на /api/tasks.
// Группировка роутов по ресурсам — стандартная практика.

function createTasksRouter(
  taskService: TaskService,
  authMiddleware: ReturnType<typeof createAuthMiddleware>,
) {
  const router = express.Router();

  // Все роуты задач требуют аутентификации.
  // router.use() применяет middleware ко всем роутам этого роутера —
  // не нужно повторять authMiddleware на каждом роуте.
  router.use(authMiddleware);

  // GET /api/tasks
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const label =
        typeof req.query.label === "string" ? req.query.label : undefined;
      const tasks = await taskService.getAllTasks(req.user!.userId, label);
      res.json(tasks); // 200 OK по умолчанию
    } catch (error) {
      next(error); // любая ошибка улетает в globalErrorHandler
    }
  });

  // POST /api/tasks
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(req.user!.userId, req.body);
      res.status(201).json(task); // 201 Created — новый ресурс создан
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/tasks/:id — обновить задачу (patch-семантика: только переданные поля)
  //
  // :id — динамический сегмент URL. Express кладёт его в req.params.id.
  // Например: PUT /api/tasks/abc-123 → req.params.id === "abc-123"
  router.put(
    "/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const task = await taskService.updateTask(
          req.user!.userId,
          req.params.id,
          req.body,
        );
        res.json(task);
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/tasks/:id
  router.delete(
    "/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await taskService.deleteTask(req.user!.userId, req.params.id);
        res.status(204).send(); // 204 No Content — успех, но тело ответа пустое (нечего возвращать)
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

// --- Роутер аутентификации ---
//
// Эти роуты публичные — JWT не нужен (пользователь ещё не залогинен).

function createAuthRouter(authService: AuthService) {
  const router = express.Router();

  // POST /api/auth/register
  router.post(
    "/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /api/auth/login
  router.post(
    "/login",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await authService.login(req.body);
        res.json(result); // 200 OK
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

// --- Глобальный обработчик ошибок ---
//
// В Express error handler отличается от обычного middleware 4 параметрами.
// Express автоматически его распознаёт и вызывает когда кто-то зовёт next(error).
//
// Один централизованный обработчик вместо try/catch + res.status() в каждом роуте.
// Принцип DRY (Don't Repeat Yourself).

function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Наши типизированные ошибки → берём их statusCode
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name, // "NotFoundError", "ValidationError" и т.д.
      message: err.message,
    });
    return;
  }

  // Неожиданная ошибка (баг в коде).
  // Логируем полный стектрейс для отладки,
  // клиенту отдаём обобщённое сообщение — не раскрываем внутренности системы.
  console.error("[Unhandled error]", err);
  res.status(500).json({
    error: "InternalServerError",
    message: "Something went wrong. Please try again later.",
  });
}

// ============================================================
// === 6. BOOTSTRAP ===========================================
// ============================================================
//
// Собираем всё вместе: создаём зависимости, передаём их внутрь,
// монтируем роутеры.
//
// Это ручной Dependency Injection. Зависимости создаются снаружи
// и передаются внутрь, а не инстанцируются внутри классов.
//
// Преимущества:
//   - Легко подменить InMemoryTaskRepository на PostgresTaskRepository
//     — меняешь одну строку здесь, весь остальной код не трогаешь
//   - Легко тестировать — передаёшь мок-репозиторий в сервис

const taskRepository = new InMemoryTaskRepository();
const userRepository = new InMemoryUserRepository();

const taskService = new TaskService(taskRepository);
const authService = new AuthService(userRepository);

const authMiddleware = createAuthMiddleware(authService);
const tasksRouter = createTasksRouter(taskService, authMiddleware);
const authRouter = createAuthRouter(authService);

// Монтируем роутеры на пути.
// Порядок важен — Express проверяет роуты сверху вниз.
app.use("/api/tasks", tasksRouter);
app.use("/api/auth", authRouter);

// Health-check endpoint — для мониторинга и оркестраторов (Docker, Kubernetes).
// Балансировщики нагрузки периодически делают GET /health чтобы убедиться
// что сервер живой и готов принимать трафик.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 для всех неизвестных маршрутов.
// Должен стоять после всех роутеров — иначе перехватит реальные роуты.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
});

// Глобальный error handler — всегда самым последним.
// Express определяет его по сигнатуре с 4 параметрами.
app.use(globalErrorHandler);

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV ?? "development"}`);
  console.log(
    `   Latency simulation: ${process.env.SIMULATE_LATENCY === "true" ? "ON" : "OFF"}`,
  );
});

export { app };
