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

See the `docs/` folder for detailed documentation:
- Architecture diagrams
- Security guidelines
- Testing guides
- Production deployment checklist
