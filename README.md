# MultipliChurch

A multi-tenant church management system. Each church is an isolated tenant — members, roles, and data are fully scoped per church with no cross-church data leakage.

## Stack

**Backend:** NestJS · PostgreSQL · Prisma · Redis · JWT · Socket.io  
**Frontend:** React 19 · TypeScript · Vite · Zustand · TanStack Query · Tailwind CSS

## How to Run

### Prerequisites
- Node.js v18+
- PostgreSQL running locally (or any accessible instance)
- Redis running locally

### Backend

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET at minimum
npm run prisma:migrate
npm run prisma:seed        # creates default super admin
npm run start:dev          # http://localhost:3000
                           # Swagger: http://localhost:3000/api/docs
```

### Frontend

```bash
cd Frontend
npm install
npm run dev                # http://localhost:5173
```

### Default credentials (after seed)

| Role        | Email               | Password    |
| ----------- | ------------------- | ----------- |
| Super Admin | `admin@example.com` | `Admin@123` |

## Approach

### Multi-Tenancy

Each `Church` is a tenant. A `ChurchMember` join table links users to churches with a scoped role (`ADMIN` or `MEMBER`). Data isolation is enforced at two levels:

1. **Request level** — `TenantInterceptor` reads the `x-church-id` header on every request, validates the church exists, and attaches it to the request. `RolesGuard` then confirms the requesting user is an actual member of that church before resolving their role.
2. **Query level** — all service methods explicitly filter by `churchId`. There is no query that returns data across churches.

The frontend API client automatically injects `x-church-id` on every request from the user's active church stored in Zustand.

**MVP constraint — one church per user:** A user can currently only belong to one church. This was a deliberate simplification. The schema, interceptor, and frontend store are all built for multi-church users — removing the constraint requires only dropping the duplicate membership check in `ChurchesService.create()`. Data isolation would still be fully enforced because every request must carry a valid `x-church-id` the user is a verified member of.

### Authentication

JWT access token (15m) + refresh token (7d) stored in HTTP-only cookies. Refresh tokens are stored in the database and rotated on every use — the old token is revoked before a new one is issued. Passwords are hashed with bcrypt (12 rounds).

### RBAC

Two separate role tiers:
- **`UserRole`** — platform-level: `SUPER_ADMIN` / `USER`
- **`ChurchRole`** — per-church: `ADMIN` / `MEMBER`

An `ADMIN` of one church has no elevated access outside that church.

## Project Structure

```
Backend/src/
├── modules/     # auth, churches, users, files, notifications
├── core/        # database, cache, mail, queue, storage, websocket, audit
├── common/      # guards, interceptors, decorators, filters
└── config/

Frontend/src/
├── pages/       # auth, dashboard, admin
├── components/  # shared UI
├── hooks/       # React Query hooks per domain
├── stores/      # auth, notifications, UI (Zustand)
└── lib/         # API client, utilities
```

