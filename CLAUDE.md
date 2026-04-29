# CLAUDE.md

## What is this

React + Vite frontend for ThreatZero, a safety management and training platform for organizations.

## Tech Stack

- React 18, TypeScript, Vite 5 (SWC plugin)
- Tailwind CSS v4 with PostCSS
- React Router v7 (client-side routing)
- TanStack Query + Zustand + Immer for state
- React Hook Form + Zod for forms
- Headless UI, Heroicons, Floating UI for components
- Keycloak for authentication
- Axios for HTTP
- Vitest for testing

## Run Locally

```bash
npm install
npm run dev        # Vite dev server
```

Required env vars (see `src/config.ts`):
- `VITE_APIS_THREATZERO_BASE_URL` -- API base URL
- `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` -- Keycloak auth

## Tests & Quality

```bash
npm test           # Vitest
npm run lint       # ESLint
npm run build      # Includes tsc type check
npx prettier --check .
```

## Architecture

- **Entry:** `src/main.tsx` -> `src/router.tsx` for all routes
- **Pages:** `src/pages/` -- route components organized by feature (admin-panel, safety-management, training-library, organizations)
- **Components:** `src/components/` -- reusable UI (forms/, layouts/, resources/, notes/, media/)
- **API layer:** `src/queries/` -- all API calls via Axios + React Query. Uses `buildUrl()`, `findOne()`, `findMany()` from `src/queries/utils.ts`
- **Auth:** Keycloak wrapped in `src/contexts/auth/`. Route guards in `src/guards/`
- **State:** Contexts in `src/contexts/` for global state; Zustand for local stores
- **Types:** `src/types/` for shared TypeScript interfaces
- **Constants:** `src/constants/` for permissions, form config, org config

## Conventions

- File naming: PascalCase for components, camelCase for utilities
- Run `npx prettier --write <file>` after modifying files
- API URLs built via `buildUrl()` helper, not hardcoded
