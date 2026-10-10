# TODOS API

REST backend for the TODOS task planner, built with **Express**, **TypeScript**, **PostgreSQL** and **Drizzle ORM**.

## Quick start

```sh
npm install
npm run dev        # http://localhost:3000
npm run db:seed    # optional: demo@example.com / demo-password-123 with sample tasks
```

No database setup is needed. Without `DATABASE_URL`, the server uses **PGlite**, a full PostgreSQL compiled to WebAssembly, and stores data in `.data/pglite`. To use a real PostgreSQL server instead:

```sh
docker compose up -d
DATABASE_URL=postgres://todos:todos@localhost:5433/todos npm run dev
```

Migrations run automatically on startup.

## Architecture

```mermaid
flowchart LR
  HTTP["http/<br/>routes, Zod validation,<br/>auth & error middleware"] --> App["application/<br/>TaskService, AuthService"]
  App --> Domain["domain/<br/>Task, User, errors,<br/>repository interfaces"]
  Infra["infrastructure/<br/>Drizzle + PostgreSQL,<br/>bcrypt, JWT"] -. implements .-> Domain
  App -. ports .-> Infra
  Main["main.ts<br/>composition root"] --> HTTP & Infra
```

| Layer             | Responsibility                                                                                                                              | Depends on                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `domain/`         | Entities and business rules (e.g. a task needs a title, labels must be valid), repository interfaces, domain errors                         | nothing                        |
| `application/`    | Use cases: register, log in, list/create/update/delete/reorder tasks, ownership checks. Uses `PasswordHasher` and `TokenService` interfaces | domain                         |
| `infrastructure/` | Drizzle repositories and schema, migrations, bcrypt, JWT, in-memory repositories for tests                                                  | domain, application interfaces |
| `http/`           | Express app factory, Zod request schemas, authentication, mapping errors to status codes, response shapes                                   | application                    |
| `main.ts`         | Reads config and wires the concrete implementations together                                                                                | everything                     |

Domain errors (`ValidationError`, `NotFoundError`, …) carry no HTTP details; the error middleware maps them to 400/401/404/409. All errors use the same shape:

```json
{
  "error": "ValidationError",
  "message": "Invalid due date",
  "details": [{ "field": "dueDate", "message": "Invalid due date" }]
}
```

## API

All task routes require `Authorization: Bearer <token>`.

| Method | Endpoint                | Body                                                                | Response                   |
| ------ | ----------------------- | ------------------------------------------------------------------- | -------------------------- |
| POST   | `/api/auth/register`    | `{ email, password }` (password ≥ 8 chars)                          | `201 { token, user }`      |
| POST   | `/api/auth/login`       | `{ email, password }`                                               | `200 { token, user }`      |
| GET    | `/api/auth/me`          | —                                                                   | `200 { user }`             |
| GET    | `/api/tasks?label=work` | —                                                                   | `200 Task[]` in list order |
| POST   | `/api/tasks`            | `{ title, description?, dueDate?, priority?, labels?, completed? }` | `201 Task`                 |
| PUT    | `/api/tasks/:id`        | any subset of the create fields                                     | `200 Task`                 |
| PUT    | `/api/tasks/order`      | `{ ids: string[] }`                                                 | `200 Task[]`               |
| DELETE | `/api/tasks/:id`        | —                                                                   | `204`                      |
| GET    | `/health`               | —                                                                   | `200 { status: "ok" }`     |

`Task` = `{ id, title, description, dueDate, priority, labels, completed, position }`.

## Security

- Passwords are stored as bcrypt hashes. Login returns the same error for an unknown email and a wrong password.
- Every task query is scoped to its owner. Other users' tasks return 404, so their IDs can't be probed.
- Zod validates every request body, unknown fields are rejected, and bodies are capped at 100 kB.
- helmet security headers, a CORS allowlist (`CORS_ORIGIN`), and rate limiting on login/register.
- The server refuses to start in production without a strong `JWT_SECRET`.

## Configuration

| Variable           | Default                 | Description                                                  |
| ------------------ | ----------------------- | ------------------------------------------------------------ |
| `PORT`             | `3000`                  | HTTP port                                                    |
| `JWT_SECRET`       | dev placeholder         | Required (≥ 32 chars) when `NODE_ENV=production`             |
| `JWT_EXPIRES_IN`   | `7d`                    | Token lifetime                                               |
| `CORS_ORIGIN`      | `http://localhost:5173` | Comma-separated allowed origins                              |
| `DATABASE_URL`     | —                       | PostgreSQL connection string; when unset, PGlite is used     |
| `PGLITE_DATA_DIR`  | `.data/pglite`          | Where PGlite stores data (`memory://` for throwaway)         |
| `SIMULATE_LATENCY` | `false`                 | Adds a 0.5–1.5 s delay in development to test loading states |

## Tests

```sh
npm test
```

- **Domain and service tests**: business rules and use cases, with in-memory repositories
- **HTTP tests** (Supertest): status codes, validation, auth, CORS, rate limiting, ownership
- **Repository contract tests**: one spec run against the in-memory repositories, PGlite, and (in CI, via `TEST_DATABASE_URL`) a real PostgreSQL server
- **Migration tests**: replay every SQL migration, including the data backfills

## Scripts

| Command                              | Description                                     |
| ------------------------------------ | ----------------------------------------------- |
| `npm run dev`                        | Start with reload on change                     |
| `npm run build` / `npm start`        | Compile to `dist/` and run it                   |
| `npm test`                           | Run all tests                                   |
| `npm run typecheck` / `npm run lint` | Static checks                                   |
| `npm run db:generate`                | Generate a migration after changing `schema.ts` |
| `npm run db:seed`                    | Create the demo account                         |
