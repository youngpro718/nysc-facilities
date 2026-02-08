# NYSC Facilities Hub

New York State Court Facilities Management System - Comprehensive facility, operations, and court management platform.

## Quick Start

### Prerequisites
- Node.js 20+ LTS
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server runs on http://localhost:8080

### Build

```bash
npm run build
npm run preview
```

## Environment Setup

Copy `.env.production.example` to `.env.local` and configure your Supabase credentials:

```bash
cp .env.production.example .env.local
```

Required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, Radix UI, shadcn/ui
- **Backend:** Supabase (Auth, Database, Realtime)
- **State Management:** Zustand, TanStack Query
- **Routing:** React Router v6
- **Forms:** React Hook Form, Zod
- **3D Visualization:** Three.js, React Three Fiber
- **Charts:** Recharts
- **PDF Generation:** jsPDF, pdfmake

## Documentation

See the `docs/` folder:
- **[USER_GUIDE.md](docs/USER_GUIDE.md)** — Complete feature guide with how-tos, FYIs, and tips
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** — Routes, roles, DB tables at a glance
- **[ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md)** — System architecture
- **[ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)** — Environment configuration
- **[RBAC_STRATEGY.md](docs/RBAC_STRATEGY.md)** — Role-based access control
- **[SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)** — Security guidelines
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** — Testing approach
- **[PRODUCTION_READY_CHECKLIST.md](docs/PRODUCTION_READY_CHECKLIST.md)** — Deployment checklist
