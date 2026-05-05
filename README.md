# Team Task Manager

A full-stack web app for teams to create projects, assign tasks, and track progress with role-based access (Admin / Member).

## Tech stack

- **Frontend**: React 18 (Vite) + Tailwind CSS + React Router + Axios
- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **Auth**: JWT (Bearer tokens) + bcrypt password hashing
- **Validation**: Joi

## Features

- Sign up / log in (JWT, hashed passwords)
- Role-based access:
  - **Admin** — create projects, add/remove members, create/assign/delete tasks
  - **Member** — view projects they belong to, update status of tasks assigned to them
- Project & team management (owner + members)
- Task management — title, description, due date, priority, status (todo / in_progress / done)
- Dashboard — totals, status breakdown, overdue tasks, tasks per user
- Kanban-style task board on the project page
- Responsive Tailwind UI

## Project structure

```
.
├── backend/
│   ├── server.js
│   ├── .env.example
│   └── src/
│       ├── config/db.js
│       ├── models/        # User, Project, Task
│       ├── controllers/   # auth, project, task, dashboard, user
│       ├── routes/        # /api/auth, /api/projects, /api/tasks, /api/dashboard, /api/users
│       ├── middleware/    # auth, role, validate, error
│       ├── validators/    # Joi schemas
│       └── utils/token.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── api/client.js          # axios instance with auth interceptor
        ├── context/AuthContext.jsx
        ├── components/            # Navbar, ProtectedRoute, Modal, TaskCard, TaskBoard
        ├── pages/                 # Login, Signup, Dashboard, Projects, ProjectDetail
        ├── App.jsx
        └── main.jsx
```

## Getting started

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a connection string

### 2. Backend

```bash
cd backend
cp .env.example .env       # edit values as needed
npm install
npm run dev                # http://localhost:5000
```

Set `JWT_SECRET` to a long random string in `.env`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so the frontend talks to the backend out of the box.

## Sample API responses

All protected endpoints require `Authorization: Bearer <token>`.

### `POST /api/auth/signup`

Request:

```json
{
  "name": "Alice Admin",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "admin"
}
```

Response (`201`):

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "66b1f0e2c2a1f1a3a5d2b001",
    "name": "Alice Admin",
    "email": "alice@example.com",
    "role": "admin"
  }
}
```

### `POST /api/auth/login`

Request:

```json
{ "email": "alice@example.com", "password": "secret123" }
```

Response (`200`):

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "66b1f0e2c2a1f1a3a5d2b001",
    "name": "Alice Admin",
    "email": "alice@example.com",
    "role": "admin"
  }
}
```

### `POST /api/projects` (admin only)

Request:

```json
{
  "name": "Website redesign",
  "description": "Q3 marketing site refresh",
  "members": ["66b1f0e2c2a1f1a3a5d2b002"]
}
```

Response (`201`):

```json
{
  "_id": "66b1f1a0c2a1f1a3a5d2b010",
  "name": "Website redesign",
  "description": "Q3 marketing site refresh",
  "owner": { "_id": "66b1f0e2c2a1f1a3a5d2b001", "name": "Alice Admin", "email": "alice@example.com", "role": "admin" },
  "members": [{ "_id": "66b1f0e2c2a1f1a3a5d2b002", "name": "Bob Member", "email": "bob@example.com", "role": "member" }],
  "createdAt": "2026-05-05T10:00:00.000Z",
  "updatedAt": "2026-05-05T10:00:00.000Z"
}
```

### `GET /api/projects`

Returns projects where the requester is owner or a member.

### `POST /api/tasks`

Request:

```json
{
  "title": "Design homepage hero",
  "description": "Mock up two variations",
  "project": "66b1f1a0c2a1f1a3a5d2b010",
  "assignedTo": "66b1f0e2c2a1f1a3a5d2b002",
  "priority": "high",
  "status": "todo",
  "dueDate": "2026-05-12T00:00:00.000Z"
}
```

Response (`201`):

```json
{
  "_id": "66b1f200c2a1f1a3a5d2b020",
  "title": "Design homepage hero",
  "description": "Mock up two variations",
  "project": "66b1f1a0c2a1f1a3a5d2b010",
  "assignedTo": { "_id": "66b1f0e2c2a1f1a3a5d2b002", "name": "Bob Member", "email": "bob@example.com", "role": "member" },
  "createdBy": { "_id": "66b1f0e2c2a1f1a3a5d2b001", "name": "Alice Admin", "email": "alice@example.com", "role": "admin" },
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-05-12T00:00:00.000Z",
  "overdue": false,
  "createdAt": "2026-05-05T10:05:00.000Z",
  "updatedAt": "2026-05-05T10:05:00.000Z"
}
```

### `PUT /api/tasks/:id`

Members can only send `{ "status": "done" }` for tasks assigned to them. Admins / project owners can update any field.

### `GET /api/dashboard`

```json
{
  "totals": {
    "projects": 3,
    "tasks": 27,
    "todo": 8,
    "inProgress": 11,
    "done": 8,
    "overdue": 3,
    "assignedToMe": 6
  },
  "tasksPerUser": [
    { "userId": "66b1...001", "name": "Alice Admin", "email": "alice@example.com", "count": 12 },
    { "userId": "66b1...002", "name": "Bob Member", "email": "bob@example.com", "count": 9 }
  ],
  "projects": [
    { "_id": "66b1f1a0c2a1f1a3a5d2b010", "name": "Website redesign" }
  ]
}
```

## Authorization summary

| Action                         | Admin | Project owner | Member (in project) | Other |
|--------------------------------|-------|---------------|---------------------|-------|
| Create project                 | ✅    | n/a           | ❌                  | ❌    |
| View project                   | ✅\*  | ✅            | ✅                  | ❌    |
| Update / delete project        | ❌\** | ✅            | ❌                  | ❌    |
| Add / remove members           | ❌\** | ✅            | ❌                  | ❌    |
| Create / assign / delete task  | ✅    | ✅            | ❌                  | ❌    |
| Update task status (assignee)  | ✅    | ✅            | ✅ (own tasks)      | ❌    |

\* Admin still needs to be the owner or a member to view a project.
\** Update/delete is owner-scoped — admins must be the project owner. (Easy to relax to all-admins if needed.)

## Error format

All errors are returned as:

```json
{ "message": "Description here", "details": ["optional list"] }
```

## License

MIT
