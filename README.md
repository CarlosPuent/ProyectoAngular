# Angular Product Manager

A fullstack CRUD application with JWT authentication, role-based access control, and automated testing.
Built as an academic showcase of modern web development practices across the full stack.

**Live →** [proyecto-angular-ten-pi.vercel.app](https://proyecto-angular-ten-pi.vercel.app) &nbsp;|&nbsp;
**API →** [proyecto-angular-api.onrender.com/api/docs](https://proyecto-angular-api.onrender.com/api/docs)

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular + TailwindCSS | 21 |
| Backend | NestJS + TypeORM | 11 |
| Database | PostgreSQL (Supabase) | — |
| Auth | Passport-JWT + bcryptjs | — |
| Testing | Vitest · Jest · supertest · Cypress | — |
| Deploy | Vercel (frontend) · Render (backend) | — |

---

## Features

- **JWT Authentication** — login, register, 401 auto-logout via HTTP interceptor
- **Role-based access** — `ADMIN` / `USER` roles; admin sees user management, controls all CRUD
- **Products** — paginated list, search by name, category filter, price range, soft delete
- **Categories** — full CRUD, auto-slug generation from name, client-side search
- **Users** — admin-only; list users, promote to admin, demote to user
- **Dashboard** — real-time stats for products, categories, and registered users
- **Swagger** — auto-generated interactive API docs

---

## Live Demo

| Environment | URL |
|-------------|-----|
| 🌐 Frontend | https://proyecto-angular-ten-pi.vercel.app |
| 🔌 API | https://proyecto-angular-api.onrender.com |
| 📖 Swagger | https://proyecto-angular-api.onrender.com/api/docs |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | Password123 |
| User | user@email.com | Password123 |

> **Note:** The backend runs on Render's free tier — the first request after inactivity may take ~30 seconds to wake up.

---

## Architecture

```
GitHub (monorepo)
    │
    ├─── push to main
    │        │
    │    ┌───▼──────────┐     ┌──────────────────┐
    │    │   Vercel      │     │     Render        │
    │    │  Angular 21   │────▶│    NestJS API     │
    │    │  (frontend)   │ JWT │  /api/* endpoints │
    │    └──────────────┘     └────────┬──────────┘
    │                                  │ TypeORM
    │                             ┌────▼────────┐
    │                             │  Supabase   │
    │                             │  PostgreSQL │
    │                             └─────────────┘
    │
    └─── auto-deploy on every push (no manual steps)
```

**Frontend** — Standalone Angular components with Signals for reactive state, functional route guards, lazy-loaded modules, and an HTTP interceptor that handles Bearer tokens and 401 responses globally.

**Backend** — Modular NestJS with per-domain modules (`auth`, `users`, `products`, `categories`), TypeORM repositories, class-validator DTOs, Passport-JWT strategy, and global rate limiting at 100 req/min.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 10+

### 1. Clone

```bash
git clone https://github.com/CarlosPuent/ProyectoAngular.git
cd ProyectoAngular
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_secret_here
PORT=3000
```

```bash
npm run start:dev      # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start              # http://localhost:4200
```

The dev environment points to `http://localhost:3000/api`. Production builds use the Render URL automatically via `environment.prod.ts`.

---

## Environment Variables

### Backend (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify tokens |
| `PORT` | Server port (default: 3000) |

### Frontend

Configured in `src/environments/`:

| File | Target |
|------|--------|
| `environment.ts` | `http://localhost:3000/api` |
| `environment.prod.ts` | `https://proyecto-angular-api.onrender.com/api` |

Angular CLI selects the correct file automatically at build time.

---

## CI/CD Flow

```
git push origin main
    │
    ├──▶ Vercel detects frontend changes
    │         builds: ng build --configuration=production
    │         deploys to CDN automatically
    │
    └──▶ Render detects backend changes
              builds: npm run build
              restarts process with new dist/
```

No manual deployments. Both platforms redeploy on every push to `main`.

---

## API Reference

Full interactive docs: [/api/docs](https://proyecto-angular-api.onrender.com/api/docs)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, receive JWT |
| `GET` | `/api/products` | ✓ | Paginated list with filters |
| `POST` | `/api/products` | ✓ | Create product |
| `PATCH` | `/api/products/:id` | ✓ | Update product |
| `DELETE` | `/api/products/:id` | ✓ | Soft-delete |
| `GET` | `/api/categories` | — | All categories (public) |
| `POST` | `/api/categories` | ✓ | Create category |
| `PATCH` | `/api/categories/:id` | ✓ | Update category |
| `DELETE` | `/api/categories/:id` | ✓ | Delete category |
| `GET` | `/api/users` | Admin | List all users |
| `PATCH` | `/api/users/:id/roles` | Admin | Assign role |

---

## Testing

### Frontend — Vitest

```bash
cd frontend

npm test                  # 262 tests across 21 files
npm run test:watch        # watch mode
npm run test:coverage     # HTML report in coverage/
```

| Metric | Coverage |
|--------|----------|
| Statements | 85% |
| Branches | 95% |
| Lines | 84% |

Covers: auth service, HTTP services, functional guards, HTTP interceptor, reactive forms (login, register), dashboard, all CRUD list and modal components.

### Backend — Jest + supertest

```bash
cd backend

npm test                  # 66 tests across 5 suites
npm run test:cov          # coverage report
```

| Suite | What it tests |
|-------|--------------|
| `auth.service.spec.ts` | login/register, bcrypt, JWT generation |
| `categories.service.spec.ts` | CRUD, slug/name deduplication |
| `roles.guard.spec.ts` | RBAC with multiple role combinations |
| `auth.integration.spec.ts` | Real HTTP flows via supertest |
| `categories.integration.spec.ts` | Auth-protected endpoints, 401/404/409 |

### E2E — Cypress

Requires both frontend and backend running locally.

```bash
cd frontend

npm run cy:open            # interactive GUI
npm run cy:run             # headless, all specs

# Demo mode (slow motion — ideal for presentations)
npm run cy:open:demo       # GUI with slowMo + human-like typing
npm run cy:demo:products   # headless demo run
```

Configure credentials in `frontend/cypress.env.json` (gitignored):

```json
{
  "TEST_EMAIL": "admin@gmail.com",
  "TEST_PASSWORD": "Password123"
}
```

| Spec | Flow |
|------|------|
| `01-auth.cy.ts` | Guards · login validation · session persistence · logout |
| `02-products.cy.ts` | Create → search → edit → delete → dashboard verification |
| `03-categories.cy.ts` | Create with auto-slug · edit · delete |

---

## Project Structure

```
ProyectoAngular/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # guards · interceptors · services · models
│   │   │   ├── features/    # auth · dashboard · products · categories · users
│   │   │   └── shared/      # modal · badge · sidebar · navbar · confirm-dialog
│   │   └── environments/    # environment.ts · environment.prod.ts
│   ├── cypress/
│   │   ├── e2e/             # spec files
│   │   └── support/         # commands.ts (cy.login with session caching)
│   └── cypress.config.ts
│
└── backend/
    └── src/
        ├── auth/            # controller · service · strategies · DTOs
        ├── users/           # controller · service · entities · DTOs
        ├── products/        # controller · service · entity · DTOs
        ├── categories/      # controller · service · entity · DTOs
        └── common/          # guards · decorators · filters · interceptors
```

---

## Deployment Notes

- **Database schema** is not auto-migrated (`synchronize: false`). Tables must exist before the backend starts.
- **Render free tier** spins down after 15 minutes of inactivity; the first cold-start request takes ~30 seconds.
- **Soft delete** — products are deactivated (`isActive = false`), never physically removed.
- **First user** registered in a fresh database automatically receives the `ADMIN` role.
- **Rate limiting** is enforced globally at 100 requests per minute per IP via `@nestjs/throttler`.

---

## Known Limitations

- No password recovery flow.
- No email verification on register.
- Render free tier has cold-start latency (~30s after inactivity).
- No pagination on the categories endpoint (all categories are loaded at once).

---

## Future Improvements

- Migrate to Render paid tier or self-hosted VPS to eliminate cold-start delay.
- Add refresh token rotation for longer sessions.
- Implement product image upload (S3 or Supabase Storage).
- Add server-side pagination to categories.
