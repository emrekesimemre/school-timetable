# School Timetabling App

A full-stack school timetabling application built with React, Express, and PostgreSQL.

## Project Structure

```
school-timetable/
├── backend/    # Express + TypeScript + Prisma
└── frontend/   # React + Vite + TailwindCSS
```

## Quick Start

### 1. Configure the Database

Edit `backend/.env` and set your PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/school_timetable?schema=public"
```

### 2. Run Migrations

```bash
cd backend
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations (creates tables)
# or: npm run db:push  (push schema without migrations)
```

### 3. Start the Backend

```bash
cd backend
npm run dev
# API available at: http://localhost:3001
# Health check:     http://localhost:3001/health
```

### 4. Start the Frontend

```bash
cd frontend
npm run dev
# App available at: http://localhost:5173
```

## API Endpoints

| Method | Path                   | Description               |
|--------|------------------------|---------------------------|
| GET    | /api/teachers          | List all teachers         |
| GET    | /api/teachers/:id      | Get teacher details       |
| POST   | /api/teachers          | Create teacher            |
| PUT    | /api/teachers/:id      | Update teacher            |
| DELETE | /api/teachers/:id      | Delete teacher            |
| GET    | /api/grades            | List all grades           |
| GET    | /api/grades/:id        | Get grade details         |
| POST   | /api/grades            | Create grade              |
| PUT    | /api/grades/:id        | Update grade              |
| DELETE | /api/grades/:id        | Delete grade              |
| GET    | /api/subjects          | List all subjects         |
| GET    | /api/classrooms        | List all classrooms       |
| GET    | /api/constraints       | List all constraints      |
| GET    | /api/assignments       | List all assignments      |
| GET    | /health                | Health check              |

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS v3, Lucide Icons, React Router, Axios
- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM, Zod validation
- **Database**: PostgreSQL

## Database Schema

Six entities: `Teacher`, `Grade`, `Subject`, `Classroom`, `Constraint`, `Assignment`.

Run `npm run db:studio` in the backend directory to open **Prisma Studio** — a visual DB browser.
