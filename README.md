# TODOS — Task Planner

![CI](https://github.com/Vinbe0/toDoApp2/actions/workflows/ci.yml/badge.svg)

A task-planning web app built with **Vue 3**, **TypeScript** and **Tailwind CSS**. Use it as a guest with tasks saved in the browser, or create an account to store tasks on the server through a REST API.

## Features

- **Tasks with details**: title, description, deadline, priority (high / medium / low) and labels
- **Filtering and sorting**: active and completed tasks, sort by deadline or priority, search by title, filter by labels (match any or all)
- **Drag-and-drop ordering** with `vue-draggable-plus`
- **Inline editing**: double-click a task to rename it, Enter saves, Esc cancels
- **Undo** after clearing completed tasks
- **Overdue highlighting**, plus active and completed counters
- **Guest or account mode**: guests use `localStorage`. When a guest signs up or logs in, the app offers to import their tasks into the new account.
- **JWT authentication** with protected routes and automatic logout when the session expires
- **Optimistic updates** that roll back and show an error toast if the request fails

## Tech stack

| Area      | Tools                                      |
| --------- | ------------------------------------------ |
| Framework | Vue 3 (Composition API, `<script setup>`)  |
| Language  | TypeScript / JavaScript                    |
| Styling   | Tailwind CSS v4, PrimeIcons                |
| Routing   | Vue Router with navigation guards          |
| Tooling   | Vite, Vitest, Vue Test Utils               |
| CI        | GitHub Actions (tests and production build) |

## Project structure

```
src/
├── api/            # HTTP client, auth and task endpoints, API <-> UI mappers
├── composables/    # useAuth (session state), useTasks (task state and logic)
├── components/     # UI components (task board, forms, navbar, ...)
├── views/          # Route-level pages
├── router/         # Routes and auth guards
├── types/          # Shared TypeScript types
└── __tests__/      # Unit tests
```

Task logic lives in the `useTasks` composable, so components only render state, and the logic can be unit-tested without the UI.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev
```

Guest mode works without a backend. Account features need the TODOS API running at `VITE_API_URL` (default `http://localhost:3000`), with these endpoints:

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Create account → JWT |
| POST   | `/api/auth/login`    | Log in → JWT         |
| GET    | `/api/tasks`         | List the user's tasks |
| POST   | `/api/tasks`         | Create a task        |
| PUT    | `/api/tasks/:id`     | Update a task        |
| DELETE | `/api/tasks/:id`     | Delete a task        |

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the dev server           |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview the production build   |
| `npm test`        | Run unit tests                 |
