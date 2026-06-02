# Resolvex (Civic Problem Management)

Full-stack civic complaints application with:
- **React + Vite** frontend
- **Node.js/Express + MongoDB** backend
- **Socket.io** for realtime updates
- **AI-based complaint classification/suggestions** (Gemini)
- **Email verification & password reset** (Nodemailer)
- **Image uploads** (Cloudinary)

> This README is a “complete report” of the project: how to run it, required configuration, API surfaces, client routes, and operational flows.

---

## 1) Project Structure

- `client/` — React frontend (routing, UI, calls to `/api`)
- `server/` — Express backend
  - `server/server.js` — app bootstrap (dotenv, middleware, routes, Socket.io, cron, health check)
  - `server/routes/*` — API route definitions (all mounted under `/api/...`)
  - `server/controllers/*` — request handlers
  - `server/models/*` — MongoDB models
  - `server/services/*` — email/AI/socket helpers
  - `server/middleware/*` — auth/protection, upload middleware
- `uploads/` — local directory that stores uploaded media (served statically)

---

## 2) Tech Stack

### Client (`client/`)
- React, React Router (`BrowserRouter`, protected/public route guards)
- Axios (`client/src/services/api.js`)
- Socket.io-client (realtime integration)
- Leaflet + React Leaflet (maps)
- Recharts (charts)
- Framer Motion (UI animations)
- react-hot-toast (notifications)

### Server (`server/`)
- Express + Helmet + CORS
- Mongoose (MongoDB)
- JWT auth (role-based access via `authorize(...)`)
- Socket.io (realtime events)
- Multer + Cloudinary (uploads)
- Nodemailer (email for verification/reset)
- node-cron (SLA breach monitoring)
- Google Generative AI (Gemini) for AI suggestions/classification

---

## 3) Environment Variables

### Where the server expects `.env`
`server/server.js` loads:
```js
require('dotenv').config({ path: '../.env' });
```
So create the file at **repo root**: `/.env`

---

### Required (Backend / Server)
Minimum variables referenced by server code:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret used for signing/verifying JWT
- `CLIENT_URL` — allowed origin for CORS + used in email links
- `PORT` — backend port (optional; default `5000`)

---

### Optional (Feature-dependent)

- **Cloudinary (uploads)**
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

- **Gemini AI (AI features)**
  - `GEMINI_API_KEY`
  - (AI services fall back to a mock path if missing/placeholder.)

- **Email (Nodemailer)**
  - `EMAIL_USER`
  - `EMAIL_PASS`

---

## 4) Setup & Run

### A) Start Server
```bash
cd server
npm install
npm start
```

Server:
- `PORT` default: `5000`
- Base API path: `http://localhost:5000/api`

Health check:
- `GET /api/health`

Server also:
- Serves uploaded media from `GET /uploads/...`
- Initializes Socket.io
- Starts an hourly cron job to update SLA breaches

---

### B) Start Client
```bash
cd client
npm install
npm run dev
```

Client:
- Vite default: `http://localhost:5173`

---

## 5) Seed Demo Users

Seed script: `server/seed.js`

It connects to MongoDB and creates three demo users:
- `admin@civic.com` (password: `password`, role: `admin`, `isVerified: true`)
- `citizen@civic.com` (password: `password`, role: `citizen`, `isVerified: true`)
- `dept@civic.com` (password: `password`, role: `department`, `isVerified: true`)

Run:
```bash
node server/seed.js
```

> `server/seed.js` currently seeds using `mongodb://localhost:27017/civic_complaints`. If your MongoDB differs, edit that connection string.

---

## 6) Client Routes (User Flows)

Client router is defined in `client/src/App.jsx`.

### Public routes
- `/` → Landing
- `/login` → Login
- `/signup` → Signup
- `/verify-email` → Email verification screen

### Citizen routes (`allowedRoles={['citizen']}`)
- `/dashboard` → Citizen dashboard
- `/raise-complaint` → Raise complaint form
- `/my-complaints` → List citizen’s complaints
- `/complaints/:id` → Complaint details
- `/profile` → Profile management

### Admin routes (`allowedRoles={['admin']}`)
- `/admin/dashboard`
- `/admin/complaints`
- `/admin/users`
- `/admin/departments`
- `/admin/analytics`
- `/admin/sla`

### Department routes (`allowedRoles={['department']}`)
- `/dept/assigned`
- `/dept/complaints/:id`
- `/dept/performance`

### Auth token handling
`client/src/services/api.js`:
- Attaches `Authorization: Bearer <token>` from `localStorage.civicToken`
- On `401`, it clears `civicToken`/`civicUser` and redirects to `/login`

---

## 7) Backend API Surface (Mounted Under `/api`)

`server/server.js` mounts:
- `/api/auth` → `server/routes/auth.js`
- `/api/complaints` → `server/routes/complaints.js`
- `/api/admin` → `server/routes/admin.js`
- `/api/department` → `server/routes/department.js`
- `/api/notifications` → `server/routes/notifications.js`
- `/api/ai` → `server/routes/ai.js`

All auth-protected behavior uses middleware from `server/middleware/auth.js`:
- `protect` — ensures logged in
- `authorize(...)` — role checking

---

### 7.1 Auth (`POST/GET /api/auth`)
From `server/routes/auth.js`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/resend-verification`
- `GET /api/auth/verify-email/:token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `GET /api/auth/me` (`protect`)
- `PUT /api/auth/profile` (`protect`)
- `PUT /api/auth/change-password` (`protect`)

---

### 7.2 Complaints (`/api/complaints`)
From `server/routes/complaints.js`:

**Protected “map/insights” endpoints**
- `GET /api/complaints/nearby` (`protect`)
- `GET /api/complaints/heatmap` (`protect`)

**Complaints collection**
- `GET /api/complaints` (`protect`)
- `POST /api/complaints` (`protect` + `authorize('citizen')`)
  - Upload fields via multer:
    - `images` max 5
    - `videos` max 2

**Single complaint**
- `GET /api/complaints/:id` (`protect`)

**Citizen/Admin/Dept actions**
- `PUT /api/complaints/:id/status`
  - `protect` + `authorize('admin','department')`
- `PUT /api/complaints/:id/assign`
  - `protect` + `authorize('admin')`
- `POST /api/complaints/:id/upvote`
  - `protect`
- `POST /api/complaints/:id/comment`
  - `protect`

---

### 7.3 Admin (`/api/admin`)
From `server/routes/admin.js` (admin-only router):
- Uses `router.use(protect, authorize('admin'))`

Endpoints:
- `GET /api/admin/dashboard`
- `GET /api/admin/analytics`
- `GET /api/admin/complaints`
- `GET /api/admin/sla`

User & department management:
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/block`
- `POST /api/admin/users/department` (create department user)

Department CRUD:
- `GET /api/admin/departments`
- `POST /api/admin/departments`
- `PUT /api/admin/departments/:id`
- `GET /api/admin/departments/:id/users`

---

### 7.4 Department (`/api/department`)
From `server/routes/department.js` (department-only router):
- Uses `router.use(protect, authorize('department'))`

Endpoints:
- `GET /api/department/assigned`
- `GET /api/department/performance`
- `PUT /api/department/complaints/:id/accept`
- `PUT /api/department/complaints/:id/reject`
- `PUT /api/department/complaints/:id/progress`
  - uploads `proofImages` (max 5) via multer
- `PUT /api/department/complaints/:id/complete`

---

### 7.5 Notifications (`/api/notifications`)
From `server/routes/notifications.js`:
- `GET /api/notifications` (`protect`)
- `PUT /api/notifications/read-all` (`protect`)
- `PUT /api/notifications/:id/read` (`protect`)

---

### 7.6 AI (`/api/ai`)
From `server/routes/ai.js` (`protect` required):
- `POST /api/ai/classify` (AI classification)
- `POST /api/ai/suggest` (AI suggestions)
- `POST /api/ai/chatbot` (AI chatbot)

---

## 8) Realtime (Socket.io)

Socket.io is initialized in `server/server.js`:
- CORS origin is `CLIENT_URL` (default: `http://localhost:5173`)
- Socket server is started before request handling

Realtime events are wired through:
- `server/services/socketService`

> The exact emitted event names are defined in `server/services/socketService.js` (not expanded in this README), but the client will connect and react based on that implementation.

---

## 9) SLA Cron / Operational Logic

`server/server.js` schedules an hourly cron:
- Cron: `0 * * * *`
- It updates complaints where SLA deadline has passed and SLA breach flag isn’t set:
  - sets `slaBreached: true`

Admin has an SLA view:
- `GET /api/admin/sla`

---

## 10) Uploads

Backend serves uploads:
- `GET /uploads/...`
via:
```js
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

Upload middleware usage:
- Complaints images/videos on `/api/complaints` and status progression proof images on department progress route.
- Cloudinary configuration is handled in `server/config/cloudinary.js`.

---

## 11) Scripts Summary

### Client (`client/`)
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### Server (`server/`)
- `npm start`
- `npm run dev` (same as `node server.js`)

---

## 12) Common Troubleshooting

- **CORS errors**
  - Ensure `CLIENT_URL` matches your running Vite origin (e.g., `http://localhost:5173`)

- **Mongo errors**
  - Ensure `MONGO_URI` is valid and MongoDB is running/reachable

- **JWT/auth errors**
  - Ensure `JWT_SECRET` exists and tokens are being issued with the same secret

- **Uploads not working**
  - Ensure Cloudinary env vars are set and upload middleware is configured properly

- **AI routes not working**
  - Ensure `GEMINI_API_KEY` is set (server falls back to mock in some cases)

- **Email not working**
  - Ensure `EMAIL_USER` and `EMAIL_PASS` are configured correctly

---

## License
Add your license if applicable.
