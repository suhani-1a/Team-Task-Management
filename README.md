# Team Task Manager

A full-stack web app where a team's admin creates projects, assigns tasks to members, and the team tracks progress on a Kanban board — with role-based access control enforced on the server.

**Live demo:** https://team-task-manager-backend-production-3b34.up.railway.app
**Source:** https://github.com/suhani-1a/Team-Task-Management

---

## Highlights

- **Authorization enforced on the server, not just the UI.** A Member cannot mark another user's task as Done even by hitting the API directly — the check lives in route middleware, not in the React component.
- **Single-service production deploy.** The Express backend serves the built React app, so there's no CORS, one URL, and one redeploy pipeline.
- **Stateless JWT auth + bcrypt-hashed passwords.** Clean fit for an SPA, no session store required.
- **Joi validation on every write endpoint** with a consistent JSON error shape.
- **Live dashboard** aggregating totals, status breakdown, overdue tasks, and per-user assignments — all from MongoDB aggregations.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express, Mongoose (MongoDB)
- **Auth:** JWT, bcrypt
- **Validation:** Joi
- **Deployment:** Railway — single service, managed MongoDB, auto-deploy on push to `main`

## Features

- Sign up / log in (JWT, hashed passwords)
- Role-based access:
  - **Admin** — create projects, add/remove members, create/assign/delete tasks
  - **Member** — view projects they belong to, update status of their own tasks
- Project & team management (owner + members)
- Task management — title, description, due date, priority, status (`todo` / `in_progress` / `done`)
- Dashboard — totals, status breakdown, overdue tasks, tasks per user
- Kanban-style task board on the project page
- Responsive Tailwind UI

## Project structure

```
.
├── package.json          # npm workspaces + deploy scripts
├── railway.json          # Railway build/start config
├── backend/
│   ├── server.js         # API + serves built frontend in production
│   ├── .env.example
│   └── src/
│       ├── config/db.js
│       ├── models/       # User, Project, Task
│       ├── controllers/  # auth, project, task, dashboard, user
│       ├── routes/       # /api/auth, /api/projects, /api/tasks, ...
│       ├── middleware/   # auth, role, validate, error
│       ├── validators/   # Joi schemas
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

## Local setup

### Prerequisites
- Node.js 18+
- A MongoDB instance (local at `mongodb://127.0.0.1:27017` or any connection string)

### Install + run (development)

```bash
git clone https://github.com/suhani-1a/Team-Task-Management.git
cd Team-Task-Management

cp backend/.env.example backend/.env
# edit backend/.env — at minimum set JWT_SECRET to a long random string

npm install   # installs both workspaces (frontend + backend)
```

Then in two terminals:

```bash
# Terminal 1 — backend on http://localhost:5000
npm --workspace backend run dev

# Terminal 2 — frontend on http://localhost:5173
npm --workspace frontend run dev
```

The Vite dev server proxies `/api` to the backend.

### Production-style run (single service, same as Railway)

```bash
npm run build        # installs deps + builds frontend
NODE_ENV=production \
PORT=5000 \
MONGO_URI=mongodb://127.0.0.1:27017/team_task_manager \
JWT_SECRET=replace_me \
npm start            # one process serves API + built React app on PORT
```

## Environment variables (backend)

| Name | Required | Notes |
|---|---|---|
| `PORT` | no (default `5000`) | Railway provides this automatically |
| `MONGO_URI` | yes | Mongo connection string |
| `JWT_SECRET` | yes | long random string |
| `JWT_EXPIRES_IN` | no (default `7d`) | e.g. `7d`, `12h` |
| `CLIENT_URL` | no | CORS origin; not needed in the single-service deploy |
| `NODE_ENV` | recommended | set to `production` in prod |

## API reference

All protected endpoints require `Authorization: Bearer <token>`.

### `POST /api/auth/signup`

```json
// Request
{ "name": "Alice", "email": "alice@example.com", "password": "secret123", "role": "admin" }

// 201
{ "token": "eyJhbGciOi...", "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "admin" } }
```

### `POST /api/auth/login`

```json
// Request
{ "email": "alice@example.com", "password": "secret123" }

// 200 — same shape as signup
```

### `POST /api/projects` (admin only)

```json
// Request
{ "name": "Website redesign", "description": "Q3 refresh", "members": ["<userId>"] }
```

### `GET /api/projects`
Returns projects where the requester is owner or a member.

### `POST /api/tasks`

```json
// Request
{
  "title": "Design homepage hero",
  "project": "<projectId>",
  "assignedTo": "<userId>",
  "priority": "high",
  "status": "todo",
  "dueDate": "2026-05-12T00:00:00.000Z"
}
```

### `PUT /api/tasks/:id`
- **Members** can only send `{ "status": "done" }` for tasks assigned to them.
- **Admins / project owners** can update any field.

### `GET /api/dashboard`

Returns totals, per-status counts, overdue count, tasks-assigned-to-me count, tasks-per-user breakdown, and the requester's projects.

## Authorization summary

| Action                         | Admin  | Project owner | Member (in project) | Other |
|--------------------------------|--------|---------------|---------------------|-------|
| Create project                 | yes    | n/a           | no                  | no    |
| View project                   | yes\*  | yes           | yes                 | no    |
| Update / delete project        | no\**  | yes           | no                  | no    |
| Add / remove members           | no\**  | yes           | no                  | no    |
| Create / assign / delete task  | yes    | yes           | no                  | no    |
| Update task status (assignee)  | yes    | yes           | yes (own tasks)     | no    |

\* Admin still needs to be the owner or a member to view a project.
\** Update/delete is owner-scoped — admins must be the project owner.

## Deployment (Railway)

Deployed as one service that hosts both the API and the React app:

- Root `package.json` declares `backend` and `frontend` as **npm workspaces**.
- `npm run build` → installs all workspace deps and runs `vite build` → produces `frontend/dist`.
- `npm start` → runs `node backend/server.js`.
- In production, [`backend/server.js`](backend/server.js) serves `frontend/dist` with an SPA fallback for client-side routes.
- A managed MongoDB service in the same Railway project provides `MONGO_URL`; the backend reads it via Railway's reference variable: `MONGO_URI=${{ MongoDB.MONGO_URL }}`.
- Every push to `main` on GitHub auto-redeploys.

## Error format

```json
{ "message": "Description here", "details": ["optional list"] }
```

## License

MIT
