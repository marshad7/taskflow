# Taskflow

![CI](https://github.com/marshad7/taskflow/actions/workflows/ci.yml/badge.svg)

A task management app built with Node.js, Express, and PostgreSQL. Session-based auth, CSRF protection, inline editing, filtering, and pagination — kept intentionally simple and framework-light.

---

## Stack

- **Backend** — Node.js, Express 5, PostgreSQL
- **Auth** — express-session, connect-pg-simple, bcryptjs
- **Security** — csrf-csrf, Helmet, express-rate-limit
- **Validation** — Zod
- **Frontend** — Pug, vanilla JS, CSS
- **Testing** — Jest, Supertest
- **CI** — GitHub Actions

---

## Features

**Auth**
- Register, login, logout
- Session-based with PostgreSQL session store
- Passwords hashed with bcrypt
- CSRF protection with automatic token refresh
- Rate limiting and secure HTTP headers

**Tasks**
- Create, update, delete tasks
- Status: `todo` / `doing` / `done`
- Priority: `low` / `medium` / `high`
- Optional due dates with overdue and due-today indicators
- Inline editing for title and description
- Search, filter by status/priority, pagination

**Quality**
- Integration tests covering auth, CRUD, data isolation, and validation
- Zod validation on all write endpoints
- GitHub Actions CI running tests against a real PostgreSQL instance
- Clean separation of routes, controllers, middleware, and validation

---

## Running locally

**1. Start PostgreSQL**
```bash
docker compose -f docker/docker-compose.yml up -d
```

**2. Install dependencies**
```bash
npm install
```

**3. Initialize the database**
```bash
psql $DATABASE_URL -f src/db/schema.sql
```

**4. Start the dev server**
```bash
npm run dev
```

Open [http://localhost:3000/app](http://localhost:3000/app)

---

## Tests

```bash
npm test
```

Tests run in-band against a separate `taskflow_test` database. CI runs on every push.

---

## Roadmap

- Email verification and password reset
- Recurring tasks
- Email reminders for upcoming due dates
- Google / Apple Calendar integration
- Production deployment guide
