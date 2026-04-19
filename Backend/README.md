# MultipliChurch — Backend

NestJS REST API for the MultipliChurch platform. Handles authentication, church management, member invitations, file storage, real-time notifications, and admin operations.

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache / Queues**: Redis (cache-manager + Bull)
- **Auth**: JWT (access + refresh tokens) + Passport
- **Email**: Resend
- **File Storage**: Local filesystem or Cloudflare R2 (S3-compatible)
- **Real-time**: Socket.io WebSockets
- **API Docs**: Swagger / OpenAPI (`/api/docs`)
- **Payments**: Stripe, Paystack, Flutterwave

## Project Structure

```
src/
├── modules/
│   ├── auth/            # Register, login, refresh, email verify, password reset
│   ├── churches/        # Church CRUD, member management, invites
│   ├── users/           # User profiles, avatar upload, activity
│   ├── files/           # File upload / download
│   └── notifications/   # Notification CRUD + real-time delivery
├── core/
│   ├── database/        # Prisma service
│   ├── cache/           # Redis cache module
│   ├── queue/           # Bull job queues
│   ├── mail/            # Email templates (Handlebars) + Resend
│   ├── storage/         # Storage abstraction (local / R2)
│   ├── websocket/       # Socket.io gateway
│   ├── audit/           # Audit logging middleware
│   └── health/          # Health check endpoint
├── common/
│   ├── decorators/      # @CurrentUser, @Roles, @Permissions, @ChurchId
│   ├── guards/          # JwtAuth, Roles, Permissions, EmailVerified, CSRF
│   ├── interceptors/    # Response wrapper, Tenant (church context)
│   └── filters/         # Global HTTP exception filter
└── config/              # App config (Joi validation), Swagger setup
```

## Setup

### Prerequisites

- Node.js v18+
- Docker (for Postgres and Redis)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. See the [Environment Variables](#environment-variables) section below.

### 3. Start infrastructure

```bash
npm run docker:up    # starts Postgres 16 and Redis 7 via Docker Compose
```

### 4. Run migrations and seed

```bash
npm run prisma:migrate   # runs all pending migrations
npm run prisma:seed      # creates the default SUPER_ADMIN account
```

### 5. Start the server

```bash
npm run start:dev   # watch mode — http://localhost:3000
```

API docs: **http://localhost:3000/api/docs**

## Available Scripts

| Script                    | Description                       |
| ------------------------- | --------------------------------- |
| `npm run start:dev`       | Start in watch mode               |
| `npm run start:prod`      | Start compiled build              |
| `npm run build`           | Compile TypeScript                |
| `npm run test`            | Run unit tests                    |
| `npm run test:e2e`        | Run end-to-end tests              |
| `npm run test:cov`        | Run tests with coverage           |
| `npm run prisma:migrate`  | Apply pending Prisma migrations   |
| `npm run prisma:seed`     | Seed the database                 |
| `npm run prisma:studio`   | Open Prisma Studio                |
| `npm run prisma:generate` | Regenerate Prisma client          |
| `npm run docker:up`       | Start Postgres + Redis containers |
| `npm run docker:down`     | Stop containers                   |

## Environment Variables

Copy `.env.example` to `.env` and fill in all required values.

```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boilerplate_dev?schema=public"

# Seed Data
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=Admin@123

# JWT
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=900

# CORS
CORS_ORIGIN=http://localhost:5173

# File Storage — "local" or "r2"
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads

# Cloudflare R2 (required when STORAGE_TYPE=r2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Email
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Payments (configure the provider(s) you use)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## API Overview

All endpoints are prefixed with `/api/v1`. Authentication uses Bearer tokens in the `Authorization` header (also set as HTTP-only cookies).

| Tag            | Base Path                      | Description                                                    |
| -------------- | ------------------------------ | -------------------------------------------------------------- |
| Authentication | `/api/v1/auth`                 | Register, login, logout, refresh, email verify, password reset |
| Churches       | `/api/v1/churches`             | Church CRUD, member management                                 |
| Invites        | `/api/v1/churches/:id/invites` | Invite and accept members                                      |
| Users          | `/api/v1/users`                | User profiles, avatar                                          |
| Files          | `/api/v1/files`                | Upload and retrieve files                                      |
| Notifications  | `/api/v1/notifications`        | List and mark notifications                                    |

Full interactive documentation is available at `/api/docs` when the server is running.

## Security Features

- **Helmet** — secure HTTP headers (CSP, XSS, etc.)
- **Rate limiting** — per-endpoint throttling via `@nestjs/throttler`
- **CSRF protection** — double-submit cookie pattern
- **Input validation** — global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- **Environment validation** — Joi schema checked at startup
- **JWT rotation** — refresh tokens are rotated and revocable
- **Audit logging** — all mutating actions are recorded with user + IP

## Data Model

Key Prisma models:

- `User` — platform account with global role (`SUPER_ADMIN` | `USER`)
- `Church` — tenant entity with slug-based identity
- `ChurchMember` — join table linking users to churches with church-scoped role (`ADMIN` | `MEMBER`)
- `ChurchInvite` — token-based email invitation with expiry
- `RefreshToken` — stored, revocable refresh tokens
- `File` — uploaded file metadata (storage path, MIME type, size)
- `Notification` — per-user notifications with type and read state
- `AuditLog` — immutable record of all key actions

## Docker

Development (Postgres + Redis only):

```bash
npm run docker:up
```

Full production stack (`Dockerfile.prod` + `docker-compose.prod.yml`):

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
