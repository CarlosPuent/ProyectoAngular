# Angular Product Manager

A fullstack web application for product and category management, built with Angular 21 and NestJS. Features JWT authentication with role-based access control, a complete CRUD interface, and a comprehensive test suite covering unit, integration, and end-to-end tests.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 21 · Standalone Components · Signals · Reactive Forms · TailwindCSS |
| **Backend** | NestJS 11 · TypeORM · Passport-JWT · Swagger · class-validator |
| **Database** | PostgreSQL via Supabase |
| **Testing** | Vitest · Jest · supertest · Cypress 12 |

---

## Features

- 🔐 **JWT Authentication** — login, register, token refresh via interceptor, 401 auto-logout
- 👥 **Role-based access** — `ADMIN` and `USER` roles; first registered user becomes admin
- 📦 **Products CRUD** — paginated list with search, category filter, price range; soft delete
- 🏷️ **Categories CRUD** — auto-slug generation, client-side search
- 👤 **User Management** — admin-only; promote/demote roles
- 📊 **Dashboard** — live stats for products, categories, and users
- 📖 **API Documentation** — Swagger UI at `/api/docs`
- 🧪 **Full test pyramid** — 262 frontend unit tests, 66 backend tests, Cypress E2E flows
- 🎬 **Cypress demo mode** — visual slow-motion execution for presentations

---

## Architecture

```
Browser (Angular 21)
    │  HTTP + Bearer JWT
    ▼
NestJS REST API  ──── Swagger /api/docs
    │
    ├── AuthModule       (login · register · JWT strategy)
    ├── UsersModule      (CRUD · role assignment)
    ├── ProductsModule   (CRUD · pagination · filters)
    └── CategoriesModule (CRUD · slug management)
         │
         ▼
    PostgreSQL (Supabase)
```

**Frontend** uses standalone Angular components with Signals for state, lazy-loaded routes, functional guards, and a functional HTTP interceptor that attaches the JWT to every request.

**Backend** is modular NestJS with TypeORM repositories, Passport-JWT strategy, class-validator DTOs, global `ValidationPipe`, and Throttler rate limiting (100 req/min).

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- PostgreSQL database (or a Supabase project)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

```bash
npm run start:dev      # development with hot-reload
npm run build          # production build
npm run start:prod     # run production build
```

### Frontend

```bash
cd frontend
npm install
npm start              # serves at http://localhost:4200
```

The frontend expects the backend at `http://localhost:3000/api`. To change this, update `frontend/src/environments/environment.ts`.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gmail.com | Password123 |
| **User** | user@gmail.com | Password123 |

> The admin account has access to user management and all CRUD operations.

---

## API Documentation

With the backend running, visit:

```
http://localhost:3000/api/docs
```

Swagger UI lists every endpoint with request/response schemas and supports authenticated calls via Bearer token.

**Main endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/products` | ✓ | List products (paginated) |
| `POST` | `/api/products` | ✓ | Create product |
| `PATCH` | `/api/products/:id` | ✓ | Update product |
| `DELETE` | `/api/products/:id` | ✓ | Soft-delete product |
| `GET` | `/api/categories` | — | List categories (public) |
| `POST` | `/api/categories` | ✓ | Create category |
| `GET` | `/api/users` | Admin | List all users |

---

## Testing

### Frontend — Vitest

```bash
cd frontend

npm test                   # run all unit tests (262 tests · 21 files)
npm run test:watch         # watch mode
npm run test:coverage      # coverage report (HTML in coverage/)
```

**Coverage:**

| Metric | Result |
|--------|--------|
| Statements | 85% |
| Branches | 95% |
| Lines | 84% |

Tested: auth service, all HTTP services, guards, interceptor, login/register forms, dashboard, CRUD list and modal components.

### Backend — Jest + supertest

```bash
cd backend

npm test                   # unit + integration tests (66 tests · 5 suites)
npm run test:watch         # watch mode
npm run test:cov           # coverage report
```

Test suites:
- `auth.service.spec.ts` — login/register flows, bcrypt, JWT generation
- `categories.service.spec.ts` — full CRUD, slug conflict, case-insensitive name check
- `roles.guard.spec.ts` — RBAC with multiple role combinations
- `auth.integration.spec.ts` — real HTTP requests via supertest
- `categories.integration.spec.ts` — protected endpoints, 401/409/404 scenarios

### E2E — Cypress

```bash
cd frontend

# Interactive GUI
npm run cy:open

# Headless
npm run cy:run
npm run cy:run:products    # products CRUD flow only

# Demo mode — slow motion for presentations
npm run cy:open:demo       # GUI with slowMo + human-like typing
npm run cy:demo:products   # headless demo
```

> **Before running E2E:** both backend (`npm run start:dev`) and frontend (`npm start`) must be running.
> Credentials are stored in `frontend/cypress.env.json` (gitignored — create from the demo credentials above).

**E2E flows:**

| File | Coverage |
|------|---------|
| `01-auth.cy.ts` | Route guards · login validation · session persistence · logout |
| `02-products.cy.ts` | Full CRUD: create → search → edit → delete → dashboard stats |
| `03-categories.cy.ts` | Create with auto-slug · edit · delete |

---

## Project Structure

```
proyectoAngular/
├── frontend/
│   ├── src/app/
│   │   ├── core/          # guards · interceptors · services · models
│   │   ├── features/      # auth · dashboard · products · categories · users
│   │   └── shared/        # layout · reusable components (modal, badge, sidebar…)
│   ├── cypress/
│   │   ├── e2e/           # spec files
│   │   └── support/       # custom commands (cy.login with session caching)
│   └── cypress.config.ts
│
└── backend/
    └── src/
        ├── auth/          # authentication module
        ├── users/         # users + roles module
        ├── products/      # products module
        ├── categories/    # categories module
        └── common/        # guards · decorators · filters
```

---

## Notes

- **TypeORM** is configured with `synchronize: false`; the database schema must exist beforehand.
- **Soft delete** for products — sets `isActive = false` rather than deleting the row.
- **Category slugs** must be lowercase alphanumeric + hyphens; auto-generated from the name in the UI.
- The backend assigns the `ADMIN` role to the first registered user and `USER` to all subsequent ones.
- Rate limiting is applied globally at 100 requests per minute per IP.
