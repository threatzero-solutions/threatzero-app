# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Formatting

```bash
# Check formatting
npx prettier --check .

# Auto-fix formatting
npx prettier --write .
```

### Testing

No test command configured yet. Vitest will be added in a future iteration.

## Workflow Rules

- **After modifying any file**, run `npx prettier --write <file>` to fix formatting.
- **Before committing**, always verify:
  1. `npm run lint` passes
  2. `npx tsc --noEmit` passes (TypeScript)
  3. `npx prettier --check .` passes (formatting)
  4. If a test runner is configured, ensure tests pass (`npx vitest run`)

### TypeScript

```bash
# Type checking is included in build command
npm run build
```

## Architecture Overview

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 with SWC
- **Routing**: React Router v7
- **State Management**: Zustand + React Query (TanStack Query) + Immer for immutable updates
- **Data Tables**: TanStack Table v8
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: Headless UI, Heroicons, Floating UI
- **Animations**: Motion (Framer Motion)
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Keycloak.js
- **HTTP Client**: Axios
- **Dates**: Day.js
- **Search**: Fuse.js (fuzzy search)
- **CSV**: PapaParse
- **Video**: Vimeo Player
- **Code Editor**: CodeMirror (for form builder)

### Project Structure

#### Core Application Flow

1. **Entry Point**: `src/main.tsx` → Mounts React app
2. **Router**: `src/router.tsx` → Defines all application routes
3. **Authentication**: Keycloak-based auth wrapped in `AuthProvider`
4. **API Layer**: `src/queries/` → All API calls using Axios + React Query

#### Key Directories

- **`src/components/`**: Reusable UI components
  - `forms/`: Form system with builder capabilities
  - `layouts/`: Layout components (modals, tables, navigation)
  - `resources/`, `notes/`, `media/`: Feature-specific components
- **`src/pages/`**: Route-specific page components
  - `admin-panel/`: Admin features (organizations, courses, forms)
  - `safety-management/`: Safety concerns, threat assessments, incident reports
  - `training-library/`: Training content management
  - `organizations/`: Organization management interface
- **`src/contexts/`**: React contexts for global state
  - `auth/`: Authentication context
  - `alert/`: Alert/notification context
  - `core/`: Core app context
  - `organizations/`, `training/`, `forms/`: Feature-specific contexts
- **`src/hooks/`**: Custom React hooks (auto-slug, item filtering, organization filters)
- **`src/guards/`**: Route permission guards (`RequirePermissions`, `with-require-permissions`)
- **`src/types/`**: TypeScript type definitions (API, core, entities, training)
- **`src/utils/`**: Utility functions (navigation, multipart uploads, organization helpers)
- **`src/constants/`**: Application constants (permissions, form config, organization config)
- **`src/queries/`**: API integration layer
  - All API calls centralized here
  - Uses `utils.ts` for common patterns
  - Base URL from environment: `VITE_APIS_THREATZERO_BASE_URL`

### API Integration Pattern

- API base URL configured via environment variable
- Common utilities in `src/queries/utils.ts`:
  - `buildUrl()`: Constructs API endpoints
  - `findOne()`, `findMany()`: Standard CRUD operations
  - Error handling with 404 → null conversion
- All queries use React Query for caching and state management

### Form System

The app includes a sophisticated form builder system:

- Dynamic form creation in `src/components/forms/FormBuilder.tsx`
- Field types and validation with Zod schemas
- Form rendering and submission handling

### Authentication Flow

- Keycloak integration configured in `src/config.ts`
- Environment variables:
  - `VITE_KEYCLOAK_URL`
  - `VITE_KEYCLOAK_REALM`
  - `VITE_KEYCLOAK_CLIENT_ID`
- Protected routes wrapped with `AuthProvider`

### Key Features

1. **Safety Management**: S.O.S. tips, threat assessments, incident reporting
2. **Training System**: Course management, enrollment tracking, progress monitoring
3. **Organization Management**: Multi-level organization hierarchy with units/subunits
4. **Resource Library**: Documents and videos management
5. **Forms Engine**: Dynamic form creation and management
6. **Admin Panel**: Comprehensive admin tools for system configuration

### Environment Variables

Required environment variables:

- `VITE_APIS_THREATZERO_BASE_URL`: Backend API base URL
- `VITE_KEYCLOAK_URL`: Keycloak server URL
- `VITE_KEYCLOAK_REALM`: Keycloak realm
- `VITE_KEYCLOAK_CLIENT_ID`: Keycloak client ID
- `VITE_BASE_NAME`: Optional base path for routing
