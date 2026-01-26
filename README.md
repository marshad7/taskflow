# Taskflow

![CI](https://github.com/marshad7/taskflow/actions/workflows/ci.yml/badge.svg)

Taskflow is a task management API built with Node.js, Express, and PostgreSQL.  
It includes session-based authentication, protected routes, task CRUD, and automated tests running in CI.

## Features
- Register / login / logout (session-based auth)
- Protected routes via middleware
- Task CRUD (create, list, update, delete)
- Status (todo, doing, done)
- Priority (low, medium, high) + optional due dates
- User-scoped data isolation (users can’t access each other’s tasks)
- Jest + Supertest API tests
- GitHub Actions CI + Postgres service
- Docker Compose for local Postgres

## Tech Stack
- Node.js, Express
- PostgreSQL
- express-session + connect-pg-simple
- Jest + Supertest
- Docker + GitHub Actions

## Run locally

```bash
docker compose -f docker/docker-compose.yml up -d
npm install
npm run dev
