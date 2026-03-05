# Full-Stack SaaS Boilerplate

A production-ready full-stack boilerplate built with modern technologies for rapid SaaS application development. This boilerplate includes authentication, authorization, payments, notifications, file management, and more.

## 🚀 Tech Stack

### Backend

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI
- **Background Jobs**: Bull (Redis-based queue)
- **Caching**: Redis with cache-manager
- **File Storage**: Cloudflare R2
- **WebSockets**: Socket.io
- **Email**: Resend
- **Validation**: class-validator
- **Security**: Helmet, CORS, Throttling

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Real-time**: Socket.io Client

## ✨ Features

### Authentication & Authorization

- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Email verification
- ✅ Password reset/recovery
- ✅ Role-based access control (RBAC)
- ✅ Protected routes

### User Management

- ✅ User CRUD operations
- ✅ User profiles
- ✅ Avatar uploads
- ✅ Activity timeline
- ✅ User roles and permissions

### Organizations

- ✅ Multi-tenancy support
- ✅ Organization management
- ✅ Team collaboration features

### Payments

- ✅ Subscription management
- ✅ Payment processing integration
- ✅ Billing history

### Notifications

- ✅ Real-time notifications (WebSocket)
- ✅ Notification center
- ✅ Push notifications
- ✅ Email notifications

### File Management

- ✅ File upload/download
- ✅ Cloudflare R2 storage integration
- ✅ Drag-and-drop file uploads
- ✅ Avatar upload with preview

### Developer Experience

- ✅ API documentation with Swagger
- ✅ Database migrations
- ✅ Database seeding
- ✅ Docker support (development & production)
- ✅ Health checks
- ✅ Audit logging
- ✅ Error handling
- ✅ Request validation
- ✅ TypeScript throughout

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ or **yarn** or **pnpm**
- **PostgreSQL**: v14+ (or use Docker)
- **Redis**: v6+ (or use Docker)
- **Docker** (optional, for containerized development)

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
