# Taskflow

![CI](https://github.com/marshad7/taskflow/actions/workflows/ci.yml/badge.svg)

A task management app built with Node.js, Express, and PostgreSQL — with an AI-powered daily planner backed by a Python/Flask microservice using the Gemini API.

---

## Stack

- **Backend** — Node.js, Express, PostgreSQL
- **AI Service** — Python, Flask, Google Gemini API
- **Frontend** — Pug, vanilla JS, CSS
- **Testing** — Jest, Supertest, GitHub Actions CI

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

**AI Daily Planner**
- "Plan My Day" button sends your tasks to a Python/Flask microservice
- Gemini API analyzes priority, due dates, and status
- Returns a focused, actionable daily plan
- Rate limited to 5 requests per user per 24 hours

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

**2. Install Node.js dependencies**
```bash
npm install
```

**3. Initialize the database**
```bash
psql $DATABASE_URL -f src/db/schema.sql
```

**4. Set up the AI service**
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your GEMINI_API_KEY
python app.py
```

**5. Start the Node.js dev server**
```bash
npm run dev
```

Open [http://localhost:3000/app](http://localhost:3000/app)

---

## Environment variables

**Node.js** (`.env`):
```
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/taskflow
SESSION_SECRET=change-me
NODE_ENV=development
```

**AI service** (`ai-service/.env`):
```
GEMINI_API_KEY=your-api-key-here
FLASK_ENV=development
```

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
