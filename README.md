# Rentora

Rentora is a rental property management project with an Express/MongoDB backend and a React/Vite frontend. It is under active development and is not production-ready.

## Project Structure

- `backend/` - Express API, Mongoose models, route handlers, middleware, and seed script.
- `frontend/` - React application built with Vite.

The backend contains API areas for authentication, properties, tenants, rental agreements, rent records, payments, inspections, documents, and notifications.

## Requirements

- Node.js and npm compatible with the versions required by the Vite 8 toolchain.
- MongoDB, running locally or available through a connection URI.

## Local Setup

Install dependencies in each application directory:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` with your local MongoDB URI and unique secrets for JWT signing. Keep `.env` private and do not commit it. Cloudinary variables are only needed when configuring Cloudinary media storage.

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
- `npm run seed` - run the seed script. Review `seed.js` and use demo data only in a development database.

Frontend, run from `frontend/`:

- `npm run dev` - start the Vite development server.
- `npm run build` - create a production build.
- `npm run preview` - preview a production build locally.
- `npm run lint` - lint the frontend source.

## Environment Variables

The example backend configuration is in [`backend/.env.example`](backend/.env.example). It includes MongoDB, JWT, server, CORS, rate-limit, and optional Cloudinary settings. Replace all placeholder secrets before using the application beyond local development.

## Current Development Status

The repository still has startup and build issues that must be resolved before the application can be used reliably:

- The backend imports an audit route that is currently missing. Its ESM configuration also conflicts with CommonJS route and model files.
- The frontend production build currently fails while loading the PostCSS configuration, and frontend lint reports errors.
- The active Vite entrypoint currently renders the starter app rather than the separate TypeScript router and pages.
- Backend route files currently do not apply the authentication/authorization middleware. Do not expose the API to untrusted users or deploy it as-is.

Re-run the backend and frontend commands above after those issues have been fixed; a successful dependency install alone does not confirm that either application starts correctly.
