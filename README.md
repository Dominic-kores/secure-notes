# Secure Notes

A full-stack note-taking app where every user has a private, password-protected notebook. Users can register, log in, and create, edit, pin, search, filter and delete their own notes, with Markdown support.

**Front end:** React + Vite · **Back end:** Express + Prisma · **Database:** PostgreSQL · **Hosting:** Vercel (client) and Railway (API)

---

## Table of contents

- [Objectives](#objectives)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started (local)](#getting-started-local)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

---

## Objectives

This project was built to practise building and shipping a secure full-stack application end to end. Its goals are to:

1. **Build a REST API** with Express that supports full CRUD (create, read, update, delete) operations on a real database.
2. **Implement secure authentication**: hash passwords with bcrypt, issue JSON Web Tokens, and protect private routes with middleware.
3. **Enforce authorisation** so that users can only access and change their own data.
4. **Validate and protect inputs** with Zod schemas, request size limits, rate limiting, CORS and Helmet security headers.
5. **Model relational data** with Prisma ORM and PostgreSQL, using migrations to manage the schema.
6. **Build a React client** that manages login state with Context, talks to the API with Axios, and supports search, filtering, pinning and Markdown.
7. **Deploy a production app**, with the front end on **Vercel**, the API on **Railway** and the database on **Supabase**, all configured through environment variables.

---

## Features

- **Accounts**: register and log in. Passwords are hashed with bcrypt and sessions use JSON Web Tokens that expire after 24 hours.
- **Private notes**: users can only see, edit, pin or delete their own notes.
- **Create, edit and delete** notes with a title, content and category.
- **Pin** important notes so they always appear first.
- **Search** across titles and content, and **filter** by category.
- **Markdown** rendering for note content.
- **Security**:
  - Helmet security headers
  - CORS restricted to the client
  - Rate limiting, stricter on login and register
  - Request size limits
  - Zod validation on every input

## Tech stack

| Layer      | Tools |
|------------|-------|
| Client     | React 19, Vite, Axios, react-markdown |
| Server     | Node.js, Express 5, Zod, bcryptjs, jsonwebtoken, Helmet, express-rate-limit, CORS |
| Database   | PostgreSQL (Supabase) via Prisma ORM |
| Deployment | Vercel (client), Railway (server) |

## Project structure

```
secure-notes-app/
├── client/                    # React front end (Vite), deployed to Vercel
│   └── src/
│       ├── components/        # LoginForm, RegisterForm, NotesDashboard
│       ├── context/           # AuthProvider and useAuth hook
│       ├── services/api.js    # Axios client (reads VITE_API_URL)
│       ├── App.jsx
│       ├── App.css            # App styles
│       └── index.css          # Global styles and theme colours
└── server/                    # Express API, deployed to Railway
    ├── prisma/
    │   ├── schema.prisma      # User and Note models
    │   └── migrations/
    └── src/
        ├── index.js           # App setup, middleware, routes
        ├── lib/prisma.js      # Shared Prisma client
        ├── middleware/        # auth (JWT), rateLimiter, validate (Zod)
        ├── routes/            # auth.js, notes.js
        └── validators/        # Zod schemas
```

---

## Getting started (local)

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- A PostgreSQL database (for example a free [Supabase](https://supabase.com/) project)

### 1. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="a-long-random-secret-string"
PORT=4001
CLIENT_URL="http://localhost:5173"
```

| Variable       | What it is |
|----------------|------------|
| `DATABASE_URL` | Connection string for your PostgreSQL database |
| `JWT_SECRET`   | Secret used to sign login tokens. Use a long random value and never commit it |
| `PORT`         | Port the API listens on (defaults to `4001`) |
| `CLIENT_URL`   | Address of the React app. Only this origin is allowed by CORS |

> **Tip:** generate a strong secret with
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Create the database tables, generate the Prisma client, and start the API:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The API runs at **http://localhost:4001**. Check it at http://localhost:4001/api/health.

### 2. Set up the client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**.

The client calls `http://localhost:4001/api` by default. To point it somewhere else, create `client/.env.local`:

```env
VITE_API_URL="http://localhost:4001/api"
```

> **Note:** `localhost:4001` is the API only, so it has no web pages. Always use the app at `localhost:5173`.

---

## Deployment

The app is deployed as two separate services:

```
Browser ──▶ Vercel (React client) ──▶ Railway (Express API) ──▶ Supabase (PostgreSQL)
```

Deploy the **API first**, because the client needs its URL.

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com/).
2. Go to **Project Settings → Database → Connection string** and copy the URI. This is your `DATABASE_URL`.

### 2. API on Railway

1. Push the project to GitHub.
2. In [Railway](https://railway.app/), click **New Project → Deploy from GitHub repo** and pick the repository.
3. Open the service's **Settings**:

   | Setting            | Value |
   |--------------------|-------|
   | Root Directory     | `server` |
   | Build Command      | `npm install && npx prisma generate` |
   | Pre-deploy Command | `npx prisma migrate deploy` |
   | Start Command      | `npm start` |

4. Under **Variables**, add:

   | Variable       | Value |
   |----------------|-------|
   | `DATABASE_URL` | Your Supabase connection string |
   | `JWT_SECRET`   | A long random secret (different from your local one) |
   | `CLIENT_URL`   | Your Vercel URL, e.g. `https://secure-notes.vercel.app` (no trailing slash) |

   Railway sets `PORT` automatically, so don't add it.

5. Under **Settings → Networking**, click **Generate Domain**. You'll get a URL like `https://secure-notes-api.up.railway.app`.
6. Check it works: `https://<your-railway-domain>/api/health` should return `{"status":"ok"}`.

### 3. Client on Vercel

1. In [Vercel](https://vercel.com/), click **Add New → Project** and import the same GitHub repository.
2. Configure the project:

   | Setting          | Value |
   |------------------|-------|
   | Root Directory   | `client` |
   | Framework Preset | Vite |
   | Build Command    | `npm run build` |
   | Output Directory | `dist` |

3. Under **Environment Variables**, add:

   | Variable       | Value |
   |----------------|-------|
   | `VITE_API_URL` | `https://<your-railway-domain>/api` |

4. Click **Deploy**.

### 4. Connect the two

If your Vercel URL changed after deploying, go back to Railway and update `CLIENT_URL` to the exact Vercel URL. Then redeploy the API so CORS allows the client.

> **Important:**
> - `VITE_` variables are baked in when the client is **built**. After changing `VITE_API_URL` on Vercel, redeploy the client.
> - Railway sits behind a proxy. To make rate limiting see each user's real IP address, add `app.set('trust proxy', 1);` in `server/src/index.js` before the rate limiter. Otherwise all users share one rate limit.

---

## API reference

Base URL: `http://localhost:4001/api` locally, or `https://<your-railway-domain>/api` in production.

Routes marked 🔒 need an `Authorization: Bearer <token>` header. You get the token from register or login.

### Auth

| Method | Endpoint         | Description | Body |
|--------|------------------|-------------|------|
| POST   | `/auth/register` | Create an account and return a token | `{ email, password, name }` |
| POST   | `/auth/login`    | Log in and return a token | `{ email, password }` |
| GET    | `/auth/me` 🔒    | Get the logged-in user's profile | – |

Validation rules: email must be valid; password 8–128 characters; name 2–100 characters.

### Notes

| Method | Endpoint             | Description | Body / query |
|--------|----------------------|-------------|--------------|
| GET    | `/notes` 🔒          | List your notes, pinned first | Query: `search`, `category`, `sortBy` (`createdAt` \| `updatedAt` \| `title`), `order` (`asc` \| `desc`) |
| POST   | `/notes` 🔒          | Create a note | `{ title, content, category?, isPinned? }` |
| GET    | `/notes/:id` 🔒      | Get one note | – |
| PUT    | `/notes/:id` 🔒      | Update a note | Any of `{ title, content, category, isPinned }` |
| DELETE | `/notes/:id` 🔒      | Delete a note | – |
| PATCH  | `/notes/:id/pin` 🔒  | Toggle pinned / unpinned | – |

`GET /notes` returns `{ notes, total, categories }`, where `categories` lists your categories for the filter dropdown.

### Other

| Method | Endpoint      | Description |
|--------|---------------|-------------|
| GET    | `/`           | API info (server root, outside `/api`) |
| GET    | `/api/health` | Server status check |

### Error responses

| Status | Meaning |
|--------|---------|
| `400`  | Validation failed (response includes a `details` list of fields and messages) or invalid note ID |
| `401`  | Missing, invalid or expired token, or wrong email/password |
| `403`  | The note belongs to another user |
| `404`  | Note or user not found |
| `409`  | An account with that email already exists |
| `429`  | Too many requests: 100 per 15 minutes overall, 10 per 15 minutes for login/register |

---

## Data model

**User**: `id`, `email` (unique), `passwordHash`, `name`, `role` (`USER` or `ADMIN`), `createdAt`, `updatedAt`

**Note**: `id`, `title`, `content`, `category` (default `"General"`), `isPinned` (default `false`), `userId`, `createdAt`, `updatedAt`

Each user has many notes; deleting a user deletes their notes.

---

## Scripts

| Location | Command           | What it does |
|----------|-------------------|--------------|
| server   | `npm run dev`     | Start the API with auto-restart (nodemon) |
| server   | `npm start`       | Start the API (used in production) |
| client   | `npm run dev`     | Start the React dev server |
| client   | `npm run build`   | Build the client for production into `client/dist` |
| client   | `npm run preview` | Preview the production build |
| client   | `npm run lint`    | Run ESLint |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot GET /api" or a JSON page at the API address | That's the API. Open the client at `localhost:5173` or your Vercel URL |
| Blank page in the client | Open the browser DevTools Console. An import error stops the whole app from rendering |
| "Failed to start server" / port in use | Another process is using port 4001. Stop it, or change `PORT` and `VITE_API_URL` to match |
| CORS error in the browser | `CLIENT_URL` on the server must exactly match the client's address (no trailing slash) |
| Deployed client still calls `localhost` | `VITE_API_URL` wasn't set when the client was built. Set it on Vercel and redeploy |
| Railway build fails on Prisma | Make sure the build command includes `npx prisma generate` and `DATABASE_URL` is set |
| Everyone gets "Too many requests" in production | Add `app.set('trust proxy', 1)` (see [Deployment](#deployment)) |
| Logged out unexpectedly | Tokens expire after 24 hours, so log in again |

---

## Author

**Dominic Kisioya**

- GitHub: [@Dominic-kores](https://github.com/Dominic-kores)

Feel free to open an issue or reach out with feedback or suggestions.
# secure-notes
# secure-notes
