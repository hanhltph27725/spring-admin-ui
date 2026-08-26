# Spring Admin UI

Admin console for the `spring-jpa-crud-dynamic` backend. Manages Users and Products.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · React Router

## Prerequisites

- Node 18+
- Backend running on `http://localhost:8080`

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

The dev server proxies `/api/*` to `http://localhost:8080` (see `vite.config.ts`), so no
CORS setup is strictly required in dev. The backend also allows `http://localhost:5173`
directly via `WebConfig`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview the production build

## Structure

```
src/
  lib/         API client (createResource) + shared types
  components/  Layout, Sidebar, Modal, Pagination, Toast, form primitives
  pages/       Dashboard, Users, Products
```

## Notes

- List views use server-side pagination + sorting via Spring's `Page` API.
- The search box filters the current page client-side (the backend has no search-query endpoint).
- Validation errors from the backend (`fieldErrors`) are mapped to individual form fields.
