# Taskflow

![CI](https://github.com/marshad7/taskflow/actions/workflows/ci.yml/badge.svg)

Taskflow is a full-stack task management application built with Node.js, Express, and PostgreSQL.
It features secure session-based authentication, CSRF protection, and a polished task user experience with pagination, filtering, and inline editing.

This project is designed as a production-style MVP with strong security, validation, and testing foundations.

---

## Features

Authentication and Security
- Register, login, and logout using session-based authentication
- Password hashing with bcrypt
- Password rules enforced at registration
- CSRF protection with automatic token refresh
- Rate limiting and secure HTTP headers via Helmet
- Clear authentication error handling (incorrect password vs account not found)
- User-scoped data isolation

Task Management
- Create, list, update, and delete tasks
- Task descriptions
- Status support: todo, doing, done
- Priority support: low, medium, high
- Optional due dates
- Inline editing for task fields
- Due-date intelligence (upcoming and overdue cues)
- Pagination, filtering, and search

Quality and Tooling
- Jest and Supertest integration tests
- GitHub Actions CI with PostgreSQL service
- Request validation using Zod
- Docker Compose for local PostgreSQL
- Clear separation of controllers, routes, validation, and frontend assets

---

## Tech Stack
- Node.js, Express
- PostgreSQL
- express-session and connect-pg-simple
- bcrypt
- csurf, helmet, express-rate-limit
- Zod
- Jest and Supertest
- GitHub Actions
- Pug, vanilla JavaScript, CSS

---

## Run Locally

Start PostgreSQL:
docker compose -f docker/docker-compose.yml up -d

Install dependencies:
npm install

Initialize database schema:
psql $DATABASE_URL -f src/db/schema.sql

Start the application:
npm run dev

Open the app at:
http://localhost:3000/app

---

## Notes
- Tests run automatically in CI on every push
- CSRF tokens are refreshed automatically when authentication state changes
- Frontend and backend are intentionally kept explicit and framework-light

---

## Roadmap
- Email verification and password recovery
- Calendar integrations (Google and Apple)
- Email reminders for upcoming tasks
- Recurring tasks and workflows
- Production deployment