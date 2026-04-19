# MultipliChurch

A full-stack church management platform built for multi-church organizations. MultipliChurch enables churches to manage their members, track activity, handle file storage, send notifications, and administrate multiple congregations from a single platform.

## Architecture

```
MultipliChurch/
├── Backend/    # NestJS REST API
└── Frontend/   # React SPA
```

## Tech Stack

### Backend

| Concern         | Technology                               |
| --------------- | ---------------------------------------- |
| Framework       | NestJS 11 (Node.js)                      |
| Database        | PostgreSQL 16 + Prisma ORM               |
| Authentication  | JWT (access + refresh tokens) + Passport |
| Caching         | Redis + cache-manager                    |
| Background Jobs | Bull (Redis-based queues)                |
| File Storage    | Local filesystem or Cloudflare R2        |
| Real-time       | Socket.io WebSockets                     |
| Email           | Resend                                   |
| API Docs        | Swagger / OpenAPI                        |
| Payments        | Stripe, Paystack, Flutterwave            |

### Frontend

| Concern       | Technology                 |
| ------------- | -------------------------- |
| Framework     | React 19 + TypeScript      |
| Build Tool    | Vite                       |
| Routing       | React Router v7            |
| State         | Zustand                    |
| Data Fetching | TanStack Query v5          |
| UI            | Radix UI + Tailwind CSS v4 |
| Forms         | React Hook Form + Zod      |
| Charts        | Recharts                   |
| Real-time     | Socket.io Client           |

## Features

### Authentication & Security

- JWT-based auth with HTTP-only cookies (access + refresh tokens)
- Email verification flow
- Password reset / recovery
- Rate limiting on all auth endpoints
- Helmet secure headers, CORS, CSRF protection
- Input validation with whitelist stripping

### Church Management (Multi-tenant)

- Create and manage multiple churches
- Church-scoped roles: `ADMIN` and `MEMBER`
- Invite members via email with token-based acceptance
- Direct add members (admin only)
- Soft-delete and audit trail per church

### User Management

- User profiles with avatar upload
- Activity timeline
- Platform roles: `SUPER_ADMIN` and `USER`
- Account status management (active / inactive / suspended)

### Admin Panel

- Super admin dashboard
- Platform-wide church and user oversight

### Notifications

- Real-time notifications via WebSocket
- Notification center with read/unread state
- Email notifications via Resend

### File Management

- File uploads with local or Cloudflare R2 storage
- Avatar upload with preview
- Church-scoped file storage

### Developer Experience

- Swagger UI at `/api/docs`
- Database migrations with Prisma
- Database seeding with a default super admin
- Docker Compose for local development (Postgres + Redis)
- Production Docker Compose
- Health check endpoint
- Audit logging for all key actions
- Structured JSON logging with Pino

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Docker** (recommended — runs Postgres and Redis automatically)

## Quick Start

### 1. Clone and install

```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### 2. Configure environment

```bash
# Backend
cd Backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT secrets, RESEND_API_KEY, etc.

# Frontend
cd ../Frontend
cp .env.example .env
# Edit .env — set VITE_API_URL
```

### 3. Start infrastructure

```bash
cd Backend
npm run docker:up   # starts Postgres and Redis containers
```

### 4. Run database migrations and seed

```bash
cd Backend
npm run prisma:migrate
npm run prisma:seed   # creates the default super admin
```

### 5. Start development servers

```bash
# Terminal 1 — backend (http://localhost:3000)
cd Backend
npm run start:dev

# Terminal 2 — frontend (http://localhost:5173)
cd Frontend
npm run dev
```

The API documentation is available at **http://localhost:3000/api/docs**.

## Default Credentials (after seed)

| Role        | Email               | Password    |
| ----------- | ------------------- | ----------- |
| Super Admin | `admin@example.com` | `Admin@123` |

> Change these immediately in your `.env` before deploying.

## Project Structure

```
Backend/
├── src/
│   ├── modules/         # Feature modules (auth, churches, users, files, notifications)
│   ├── core/            # Infrastructure (database, cache, mail, queue, storage, websocket, audit, health)
│   ├── common/          # Shared decorators, guards, interceptors, filters
│   └── config/          # App and Swagger configuration
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
└── docker-compose.yml

Frontend/
├── src/
│   ├── pages/           # Route pages (auth, dashboard, admin)
│   ├── components/      # Shared UI components
│   ├── hooks/           # React Query hooks
│   ├── stores/          # Zustand stores (auth, notifications, UI)
│   ├── layouts/         # Dashboard and admin layouts
│   ├── lib/             # API client and utilities
│   └── types/           # TypeScript types
└── vite.config.ts
```

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd BoilerPlate
```

### 2. Install dependencies

#### Backend

```bash
cd Backend
npm install
```

#### Frontend

```bash
cd Frontend
npm install
```

### 3. Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `Backend` directory:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Resend)
RESEND_API_KEY=re_...
MAIL_FROM=noreply@yourapp.com

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Frontend Environment Variables

Create a `.env` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
cd Backend
npm run docker:up
```

#### Manual Setup

Start PostgreSQL and Redis services, then run:

```bash
cd Backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 🚀 Running the Application

### Development Mode

#### Start Backend

```bash
cd Backend
npm run start:dev
```

Backend will run on: `http://localhost:3000`
Swagger API docs: `http://localhost:3000/api/docs`

#### Start Frontend

```bash
cd Frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

### Production Mode

#### Backend

```bash
cd Backend
npm run build
npm run start:prod
```

#### Frontend

```bash
cd Frontend
npm run build
npm run preview
```

### Using Docker

#### Development

```bash
cd Backend
docker-compose up -d
```

#### Production

```bash
cd Backend
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
BoilerPlate/
├── Backend/
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Prisma schema definition
│   │   ├── seed.ts          # Database seeding
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── common/          # Shared utilities
│   │   │   ├── decorators/  # Custom decorators
│   │   │   ├── filters/     # Exception filters
│   │   │   ├── guards/      # Auth guards
│   │   │   ├── interceptors/# Interceptors
│   │   │   └── utils/       # Utility functions
│   │   ├── config/          # Configuration files
│   │   ├── core/            # Core services
│   │   │   ├── audit/       # Audit logging
│   │   │   ├── cache/       # Cache module
│   │   │   ├── database/    # Database module
│   │   │   ├── health/      # Health checks
│   │   │   ├── mail/        # Email service
│   │   │   ├── queue/       # Background jobs
│   │   │   ├── storage/     # File storage
│   │   │   └── websocket/   # WebSocket gateway
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── users/       # User management
│   │   │   ├── roles/       # Role management
│   │   │   ├── organizations/ # Organization management
│   │   │   ├── payments/    # Payment processing
│   │   │   ├── notifications/ # Notifications
│   │   │   └── files/       # File management
│   │   └── main.ts          # Application entry point
│   ├── docker-compose.yml   # Docker Compose (dev)
│   └── Dockerfile           # Docker image definition
│
└── Frontend/
    ├── public/              # Static assets
    ├── src/
    │   ├── assets/          # Images, fonts, etc.
    │   ├── components/      # Reusable components
    │   │   ├── ui/          # UI component library
    │   │   └── navigation/  # Navigation components
    │   ├── hooks/           # Custom React hooks
    │   ├── layouts/         # Layout components
    │   ├── lib/             # Core utilities
    │   │   ├── api-client.ts # API client setup
    │   │   └── utils.ts     # Utility functions
    │   ├── pages/           # Page components
    │   │   ├── auth/        # Auth pages
    │   │   ├── admin/       # Admin pages
    │   │   └── dashboard/   # Dashboard pages
    │   ├── stores/          # Zustand stores
    │   ├── types/           # TypeScript types
    │   └── main.tsx         # Application entry point
    └── vite.config.ts       # Vite configuration
```

## 📜 Available Scripts

### Backend Scripts

```bash
npm run start:dev        # Start development server
npm run build            # Build for production
npm run start:prod       # Start production server
npm run lint             # Lint code
npm run format           # Format code
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
```

### Frontend Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
```

## 🗄️ Database Management

### Prisma Studio

Access the database GUI:

```bash
cd Backend
npm run prisma:studio
```

### Creating Migrations

```bash
cd Backend
npx prisma migrate dev --name your_migration_name
```

### Resetting Database

```bash
cd Backend
npx prisma migrate reset
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configured cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Request validation with class-validator
- **Password Hashing**: Bcrypt for password encryption
- **JWT Authentication**: Secure token-based auth
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 🧪 Testing

### Backend Tests

```bash
cd Backend
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests
```

## 📚 API Documentation

Once the backend is running, access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

## 🐳 Docker Support

The project includes Docker configurations for both development and production environments.

### Development with Docker

```bash
cd Backend
docker-compose up -d
```

This will start:

- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000

### Production with Docker

```bash
cd Backend
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For support, please open an issue in the repository or contact the maintainers.

---

**Happy Coding! 🚀**
