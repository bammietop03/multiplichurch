# MultipliChurch — Frontend

React SPA for the MultipliChurch platform. Provides a dashboard for church members and admins, a super-admin panel, and all authentication flows.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router v7
- **State**: Zustand
- **Data Fetching**: TanStack Query v5
- **UI**: Radix UI primitives + Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **Notifications**: Sonner (toast)

## Project Structure

```
src/
├── pages/
│   ├── auth/           # Login, Register, Forgot/Reset Password, Verify Email
│   ├── dashboard/      # Overview, Churches, Members, Profile, Settings
│   ├── admin/          # Super-admin overview and church management
│   ├── home.tsx        # Public landing page
│   └── invite-accept.tsx
├── components/
│   ├── ui/             # Base UI components (Button, Dialog, Table, etc.)
│   ├── navigation/     # Sidebar and top nav
│   ├── activity-timeline.tsx
│   ├── add-member-dialog.tsx
│   ├── avatar-upload.tsx
│   ├── confirm-dialog.tsx
│   ├── notification-dropdown.tsx
│   ├── onboarding-dialog.tsx
│   └── user-detail-modal.tsx
├── hooks/              # React Query hooks (use-auth, use-churches, use-users, etc.)
├── stores/             # Zustand stores (auth-store, notification-store, ui-store)
├── layouts/            # DashboardLayout, AdminLayout
├── lib/
│   ├── api-client.ts   # Axios instance with interceptors
│   └── utils.ts
└── types/              # Shared TypeScript types
```

## Setup

### Prerequisites

- Node.js v18+
- Backend running on `http://localhost:3000` (see [Backend README](../Backend/README.md))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

```env
# Full API URL with version path (used for REST calls)
VITE_API_URL=http://localhost:3000/api/v1

# Base URL without version (used for WebSocket connection)
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start development server

```bash
npm run dev   # http://localhost:5173
```

## Available Scripts

| Script            | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR                |
| `npm run build`   | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build locally          |
| `npm run lint`    | Run ESLint                                    |

## Pages & Routes

| Route                   | Page               | Access        |
| ----------------------- | ------------------ | ------------- |
| `/`                     | Home (landing)     | Public        |
| `/auth/login`           | Login              | Public        |
| `/auth/register`        | Register           | Public        |
| `/auth/forgot-password` | Forgot Password    | Public        |
| `/auth/reset-password`  | Reset Password     | Public        |
| `/auth/verify-email`    | Email Verification | Public        |
| `/dashboard`            | Overview           | Authenticated |
| `/dashboard/churches`   | My Churches        | Authenticated |
| `/dashboard/members`    | Church Members     | Church Admin  |
| `/dashboard/profile`    | User Profile       | Authenticated |
| `/dashboard/settings`   | Settings           | Authenticated |
| `/invite/:token`        | Accept Invitation  | Public        |
| `/admin`                | Admin Overview     | Super Admin   |
| `/admin/churches`       | All Churches       | Super Admin   |
| `/admin/login`          | Admin Login        | Public        |

## State Management

| Store                | Responsibility                                  |
| -------------------- | ----------------------------------------------- |
| `auth-store`         | Current user, token state, login/logout actions |
| `notification-store` | Real-time notifications list and unread count   |
| `ui-store`           | Theme (light/dark) and sidebar collapse state   |

## API Client

`lib/api-client.ts` exports a configured Axios instance that:

- Sets the `Authorization: Bearer <token>` header automatically
- Attaches `x-church-id` from the active church context
- Refreshes the access token on 401 responses and retries the original request
- Redirects to `/auth/login` on unrecoverable auth failures

## Building for Production

```bash
npm run build
```

Output is written to `dist/`. Serve the `dist/` directory with any static file server or CDN. All routes must fall back to `index.html` for client-side routing to work.
