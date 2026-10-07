# Rentora

Rentora is a rental property management project with an Express backend using SQLite and a React/Vite frontend. It is under active development and is not production-ready.

## Project Structure

- `backend/` - Express API, SQLite-backed models, route handlers, middleware, and seed script.
- `frontend/` - React application built with Vite.

The backend contains API areas for authentication, properties, tenants, rental agreements, rent records, payments, inspections, documents, and notifications.

## Requirements

- Node.js and npm compatible with the versions required by the Vite 8 toolchain.
- No separate database server is required; the backend creates a local SQLite database file.

## Local Setup

Install dependencies in each application directory:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set unique secrets for JWT signing in `backend/.env`. Keep `.env` private and do not commit it. The SQLite file defaults to `backend/data/rentora.sqlite`; set `SQLITE_DB_PATH` to choose a different path. Cloudinary variables are only needed when configuring Cloudinary media storage.

Start the backend from the `backend/` directory:

```powershell
npm run dev
```

In a separate terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL when it starts. The backend defaults to port `4000`; the frontend defaults to port `5173`. Set `CLIENT_URL` in the backend environment if the frontend uses a different origin.

## Useful Commands

Backend, run from `backend/`:

- `npm run dev` - start with Nodemon.
- `npm start` - start the API with Node.js.
- `npm run seed` - create/reset the local SQLite database with demo data. Use it only for development data.

Frontend, run from `frontend/`:

- `npm run dev` - start the Vite development server.
- `npm run build` - create a production build.
- `npm run preview` - preview a production build locally.
- `npm run lint` - lint the frontend source.

## Environment Variables

The example backend configuration is in [`backend/.env.example`](backend/.env.example). It includes SQLite, JWT, server, CORS, rate-limit, and optional Cloudinary settings. Replace all placeholder secrets before using the application beyond local development.

## Current Development Status

- ✅ All backend API endpoints (19/19) pass integration and IDOR security tests.
- ✅ Frontend production build compiles cleanly without errors.
- ✅ Linter passes with 0 errors.
- ✅ Complete full-stack property management system is operational.
