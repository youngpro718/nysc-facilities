# NYSC Facilities Hub

**New York State Court Facilities Management System**

A comprehensive internal platform for managing court facilities, operations, inventory, staff access, and court scheduling across New York State courthouse buildings.

---

> **Version:** 1.0.0
> **Created:** January 2024
> **Last Updated:** March 2026
> **Creator:** Jack Duchatelier — Developer & Designer
> **Support:** nyscfacilitieshub@gmail.com
>
> ⚠️ **Before go-live:** Register `nyscfacilitieshub@gmail.com` on Gmail and set up forwarding to your main inbox.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Technology Stack](#technology-stack)
3. [Installation](#installation)
4. [Running Locally](#running-locally)
5. [Building & Deploying](#building--deploying)
6. [Project Structure](#project-structure)
7. [Environment Variables](#environment-variables)
8. [User Roles & Access](#user-roles--access)
9. [Feature Modules](#feature-modules)
10. [Database & Backend](#database--backend)
11. [Available Scripts](#available-scripts)
12. [Feature Update History](#feature-update-history)
13. [Support](#support)

---

## What This App Does

NYSC Facilities Hub is a role-gated internal web application used by New York State court staff to:

- **Track and manage courthouse spaces** — floors, rooms, capacity, occupancy, 3D floorplan viewer
- **Report and resolve facility issues** — submit maintenance/repair requests, track status, assign to staff
- **Manage keys and access passes** — lockbox assignment, elevator card issuance, key checkout history
- **Run court operations** — daily AM/PM session scheduling, judge/clerk assignments, AI-assisted PDF extraction from daily court reports, live court grid
- **Manage inventory and supply requests** — stock tracking, low-stock alerts, supply order fulfillment
- **Handle lighting systems** — fixture tracking, zone management, status monitoring
- **Staff and occupant management** — room assignments, department records, access control
- **Admin oversight** — user approval, role management, module feature flags, routing rules, system settings

The application enforces a full onboarding flow (email verification → admin approval → profile completion) before any authenticated user can access protected features.

---

## Technology Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 7 (with SWC compiler) |
| Styling | Tailwind CSS 3, Radix UI, shadcn/ui |
| Backend / Auth / DB | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| Data fetching | TanStack Query v5 |
| Global state | Zustand |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| 3D visualization | Three.js, React Three Fiber, React Three Drei |
| Charts | Recharts |
| PDF parsing | pdf.js (pdfjs-dist) |
| PDF generation | jsPDF, pdfmake |
| Excel import/export | ExcelJS, xlsx |
| Rich text | Tiptap |
| Drag and drop | @dnd-kit |
| Animations | Framer Motion |
| Canvas drawing | Fabric.js |
| AI extraction | Supabase Edge Functions calling OpenAI GPT-4o (server-side) |
| PWA | vite-plugin-pwa (Workbox) — production only |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Netlify (configured via `netlify.toml`) |

---

## Installation

**Prerequisites:**
- Node.js 20+ LTS
- npm (bundled with Node) or bun

```bash
# Clone the repository
git clone <repository-url>
cd nysc-facilities-main

# Install dependencies
npm install
```

---

## Running Locally

1. **Create your local environment file:**

```bash
cp .env.production.example .env.local
```

2. **Fill in your Supabase credentials** in `.env.local` (see [Environment Variables](#environment-variables)).

3. **Start the dev server:**

```bash
npm run dev
```

The server starts at **http://localhost:8080** (port is hard-coded in `vite.config.ts`).

> **Note:** Hot Module Replacement is enabled. The dev server suppresses WebSocket RSV1 errors that can be triggered by certain browser extensions — this is intentional and not a bug.

4. **Apply database migrations** (first-time setup):

Run each file in `db/migrations/` in order (001 through 029) against your Supabase project using the Supabase SQL editor or CLI:

```bash
# Using Supabase CLI (if installed)
supabase db push

# Or apply manually via Supabase Dashboard → SQL Editor
```

---

## Building & Deploying

### Production build

```bash
npm run build
```

Output goes to `dist/`. The PWA service worker is only generated in production mode.

### Preview the production build locally

```bash
npm run preview
```

### Deploy to Netlify

The project is pre-configured for Netlify via `netlify.toml`:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **All routes** fall back to `index.html` (SPA routing)
- **Security headers** are set at the CDN level (CSP, HSTS, X-Frame-Options, etc.)

**Steps:**
1. Connect the repository to a Netlify project
2. Set environment variables in Netlify dashboard → Site settings → Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Trigger a deploy

> ⚠️ **Never commit `.env.local` or `.env.production` to version control.** Use your deployment platform's secret management.

### Supabase Edge Functions

Three edge functions live in `edge-functions/`:

| Function | Purpose |
|---|---|
| `parse-pdf` | AI-powered court report PDF extraction (calls OpenAI GPT-4o) |
| `support-chat` | In-app AI support chat (calls Gemini 2.0 Flash) |
| `export-rooms` | Exports room data to Excel |
| `import-rooms` | Imports room data from Excel |

Deploy via [Supabase CLI](https://supabase.com/docs/guides/functions/deploy):

```bash
supabase functions deploy parse-pdf
supabase functions deploy support-chat
supabase functions deploy export-rooms
supabase functions deploy import-rooms
```

Required Supabase secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...         # for parse-pdf
supabase secrets set GEMINI_API_KEY=AIza...        # for support-chat
```

If `GEMINI_API_KEY` is not set, the support chat gracefully shows the support email instead of crashing.

---

## Project Structure

```
nysc-facilities-main/
├── src/
│   ├── App.tsx                    # Root router and provider tree
│   ├── main.tsx                   # Entry point
│   ├── config/
│   │   ├── index.ts               # All app-wide constants (timeouts, limits, cache TTLs)
│   │   └── roles.ts               # Single source of truth for the role system
│   ├── features/                  # Feature-sliced modules (see Feature Modules section)
│   │   ├── admin/                 # Admin dashboard, user management, system settings
│   │   ├── auth/                  # Login, signup, MFA, onboarding, role/permission hooks
│   │   ├── court/                 # Court operations, sessions, PDF extraction, live grid
│   │   ├── dashboard/             # Per-role dashboards, notifications, activity feed
│   │   ├── facilities/            # Room detail panels, facility-level views
│   │   ├── forms/                 # Public forms, key/supply/maintenance/issue request forms
│   │   ├── inventory/             # Inventory items, categories, transactions, audits
│   │   ├── issues/                # Issue reporting, admin issue management
│   │   ├── keys/                  # Key assignments, elevator passes, lockboxes
│   │   ├── lighting/              # Lighting fixtures, zones, status management
│   │   ├── occupants/             # Room assignments, access management
│   │   ├── operations/            # Facility operations, shutdowns, maintenance
│   │   ├── profile/               # User profile, settings, theme preferences
│   │   ├── spaces/                # Spaces browser, 3D floorplan viewer, floor management
│   │   ├── supply/                # Supply requests, orders, staff fulfillment dashboard
│   │   └── tasks/                 # Task management
│   ├── providers/                 # React context providers
│   │   ├── RealtimeProvider.tsx   # Supabase realtime channel (inventory changes)
│   │   ├── DashboardCustomizationProvider.tsx  # Per-user dashboard layout (synced to Supabase)
│   │   └── EnhancedThemeProvider.tsx           # Theme, font size, density, accessibility
│   ├── routes/
│   │   ├── OnboardingGuard.tsx    # Enforces the onboarding flow before app access
│   │   └── ModuleProtectedRoute.tsx  # Admin-toggleable feature gate per module
│   ├── shared/                    # Shared components, hooks, and utilities
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client singleton
│   │   ├── queryKeys.ts           # Centralized TanStack Query key registry
│   │   └── logger.ts              # Environment-aware logger
│   ├── types/                     # Global TypeScript types
│   └── ui/
│       └── DataState.tsx          # Generic loading/error/empty state component
├── db/
│   └── migrations/                # SQL migration files (001–029, apply in order)
├── edge-functions/
│   ├── parse-pdf/                 # AI PDF extraction edge function
│   ├── export-rooms/              # Room data export
│   └── import-rooms/             # Room data import
├── docs/                          # Extended documentation
│   ├── USER_GUIDE.md
│   ├── QUICK_REFERENCE.md
│   ├── ARCHITECTURE_DIAGRAM.md
│   ├── ENVIRONMENT_SETUP.md
│   ├── RBAC_STRATEGY.md
│   ├── SECURITY_CHECKLIST.md
│   ├── TESTING_GUIDE.md
│   └── PRODUCTION_READY_CHECKLIST.md
├── tests/                         # Playwright E2E tests
├── public/                        # Static assets and PWA icons
├── .env.production.example        # Template for environment variables
├── netlify.toml                   # Netlify deploy config (build, redirects, security headers)
├── vite.config.ts                 # Vite build config (aliases, PWA, port)
├── tailwind.config.ts             # Tailwind theme config
└── playwright.audit.config.ts     # Playwright config for the 27-page layout audit suite
```

---

## Environment Variables

Copy `.env.production.example` to `.env.local` for local development:

```bash
cp .env.production.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | Your Supabase project URL (e.g. `https://abc123.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous/public key |
| `VITE_LOG_LEVEL` | No | Log verbosity: `debug`, `info`, `warn`, `error` (default: `info`; set to `error` in production) |
| `VITE_FLOORPLAN_DEBUG` | No | Set to `true` to enable 3D floorplan debug overlays |
| `VITE_DISABLE_MODULE_GATES` | No | Set to `true` to bypass module feature flags (dev convenience only) |

**Supabase Edge Function secrets** (set via `supabase secrets set`):

| Secret | Required for | Description |
|---|---|---|
| `OPENAI_API_KEY` | `parse-pdf` function | OpenAI API key for AI court report extraction (GPT-4o) |
| `SUPABASE_SERVICE_ROLE_KEY` | All edge functions | Auto-injected by Supabase runtime — do not set manually |

> ⚠️ **Security:** Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code. The anon key is safe to include in the client bundle as it is governed by Row Level Security (RLS) policies.

---

## User Roles & Access

The app has 5 roles defined in `src/config/roles.ts`. All new accounts default to `standard` and require admin approval before accessing the app.

| Role | Label in UI | Access Summary |
|---|---|---|
| `standard` | User | Submit issue reports and supply requests; view own dashboard |
| `court_aide` | Court Aide | Manage inventory; fulfill supply orders; complete tasks |
| `court_officer` | Court Officer | Key management; building security; read-only spaces access |
| `cmc` | Management | Court scheduling; session management; operations oversight |
| `admin` | Administrator | Full access; user approval; module feature flags; system settings |

> Admin accounts can use **Dev Mode** (bottom-right panel in development) to preview the app as any other role without changing their actual role.

---

## Feature Modules

Modules can be individually enabled or disabled by an administrator via the Admin Center. This allows gradual feature rollout without a code deploy.

| Module Key | Feature Area | Default Visibility |
|---|---|---|
| `spaces` | Spaces browser + 3D floorplan viewer | Role-gated |
| `operations` | Facility operations + issue tracking | Role-gated |
| `occupants` | Room assignments and access management | Admin only |
| `inventory` | Inventory management | Role-gated |
| `keys` | Key and elevator pass management | Role-gated |
| `lighting` | Lighting fixture and zone management | Admin only |
| `court_operations` | Court scheduling + AI PDF extraction | Role-gated |

---

## Database & Backend

The database schema is managed by numbered SQL migration files in `db/migrations/`. Apply them in order against your Supabase project.

**Key tables (derived from migrations and code):**

| Table | Purpose |
|---|---|
| `profiles` | User profile data, role, department, onboarding state |
| `user_roles` | RBAC role assignments |
| `user_preferences` | Per-user dashboard layout and UI preferences |
| `buildings` / `floors` / `rooms` | Spatial hierarchy |
| `issues` | Facility issue reports |
| `inventory_items` / `inventory_categories` | Inventory catalog |
| `inventory_item_transactions` | Stock movement history |
| `court_sessions` | Daily court session scheduling |
| `court_rooms` | Courtroom registry |
| `court_assignments` | Judge/clerk assignments to courtrooms |
| `court_attendance` | Daily judge/clerk attendance |
| `supply_requests` / `supply_orders` | Supply workflow |
| `key_assignments` | Key checkout records |
| `lighting_fixtures` / `lighting_zones` | Lighting inventory |
| `admin_notifications` | System notifications |
| `ai_invocation_log` | AI feature usage tracking for rate limiting |
| `pdf_extraction_logs` | Court PDF extraction audit trail |

**Realtime subscriptions** (Supabase Realtime):
- `inventory_items`, `inventory_categories`, `inventory_item_transactions` — global channel (`global_changes`)
- `court_sessions`, `court_attendance`, `court_room_status`, `court_activity_log`, `coverage_assignments` — court operations channel (`court_ops_changes`)

---

## Available Scripts

```bash
npm run dev           # Start dev server at http://localhost:8080
npm run build         # Production build → dist/
npm run build:dev     # Development-mode build (no PWA, no minification)
npm run preview       # Serve the production build locally
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type check (no emit)
npm test              # Run Vitest unit tests (watch mode)
npm run test:run      # Run Vitest unit tests once (verbose)
npm run test:ui       # Vitest with browser UI
npm run test:e2e      # Playwright E2E tests (headless)
npm run test:e2e:headed  # Playwright E2E tests (headed — watch the browser)
```

**Playwright audit suite** (27-page layout + console-error check):

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
PLAYWRIGHT_ADMIN_EMAIL=your@email.com \
PLAYWRIGHT_ADMIN_PASSWORD=yourpassword \
npx playwright test --config=playwright.audit.config.ts --headed
```

Add `--grep "A5-01"` for a quick health sweep only.

---

## Feature Update History

> ⚠️ *No formal changelog exists in this repository. The history below is reconstructed from database migration numbering and known development milestones. Exact dates are unknown except where noted.*

### v1.0.0 — Current (Last updated: March 2026)

**Scalability & reliability improvements (March 2026):**
- Added `.limit()` guards on all unbounded Supabase queries
- Added `staleTime`/`gcTime` to 21+ reference-data queries to reduce unnecessary refetches
- Centralized TanStack Query key registry (`src/lib/queryKeys.ts`)
- Introduced 5-minute sessionStorage cache for role/permission lookups
- Added AI extraction rate limiting: max 5 PDF extractions per hour per user
- Added `ai_invocation_log` table for cost visibility
- Added `user_preferences` table for cross-device dashboard layout sync
- Fixed Supabase realtime broadcast channel leak in court operations
- Rewrote `EnhancedUserSettings` (902 → 390 lines, removed `@ts-nocheck`)

**Court Operations (prior milestones):**
- AI-assisted PDF extraction for daily AM/PM court reports (OpenAI GPT-4o via edge function)
- Live court grid with judge/clerk presence tracking
- Session scheduling with conflict detection
- Term sheet management
- 30-second cooldown on AI extraction to prevent accidental double-submissions

**Spaces & Floorplan:**
- 3D interactive floorplan viewer (Three.js + React Three Fiber)
- Floor and room management with building hierarchy
- Excel import/export for room data

**Supply & Inventory:**
- Supply request workflow (user → Court Aide fulfillment)
- Purchase order management
- Inventory audit trail
- Low-stock alerts and notifications

**Keys & Access:**
- Key assignment and checkout history
- Elevator card / pass management
- Lockbox management

**Auth & Onboarding (migrations 011–023):**
- Email verification → admin approval → profile onboarding flow
- RBAC role system with 5 roles
- Optional MFA setup
- Account rejection with notification

**Admin & Operations:**
- Module feature flags (enable/disable features without a deploy)
- Routing rules management
- Form template builder
- Facility operations and shutdown tracking
- Lighting fixture and zone management

---

## Support

### Documentation

Extended documentation is in the `docs/` folder:

| Document | Contents |
|---|---|
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Full feature guide, how-tos, tips |
| [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) | Routes, roles, DB tables at a glance |
| [ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md) | System architecture overview |
| [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) | Detailed environment configuration |
| [RBAC_STRATEGY.md](docs/RBAC_STRATEGY.md) | Role-based access control design |
| [SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) | Security guidelines and checklist |
| [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | Testing approach and how to run tests |
| [PRODUCTION_READY_CHECKLIST.md](docs/PRODUCTION_READY_CHECKLIST.md) | Pre-deploy checklist |

A full HTML and PDF user guide are also included in the repository root:
- `NYSC_Facilities_User_Guide.html`
- `NYSC_Facilities_User_Guide.pdf`

### In-App Help

The app includes a built-in **Help Center** accessible from any page (question mark icon in the navigation). It covers feature walkthroughs, FAQs, and role-specific tips.

### Human & AI Support

| Channel | Details |
|---|---|
| **Email** | nyscfacilitieshub@gmail.com |
| **AI Chat** | Built-in — click the chat bubble (bottom-left corner) in any authenticated page |
| **Help Center** | Navigate to Help in the app sidebar |

The AI support chat is powered by a Supabase Edge Function (`support-chat`) using Gemini. It knows the full feature set and common troubleshooting steps. When it can't answer, it automatically directs users to the support email.

> ⚠️ **Before go-live:** Register `nyscfacilitieshub@gmail.com` on Gmail. For AI chat to work in production, set the `GEMINI_API_KEY` Supabase secret:
> ```bash
> supabase secrets set GEMINI_API_KEY=AIza...
> ```
> If the secret is not set, the chat gracefully falls back to showing the support email.

---

### Where Creator / Support Info Appears in the App

All strings are sourced from `src/lib/appInfo.ts` — update that one file to change them everywhere at once.

| Location | File | What's shown |
|---|---|---|
| **App footer** (desktop, every page) | `src/components/layout/Layout.tsx` | Version · Creator · Copyright · Support email |
| **Login page** | `src/features/auth/pages/LoginPage.tsx` | Version · "Built by Jack Duchatelier" · Support email |
| **Error boundary** | `src/shared/components/error/ErrorBoundary.tsx` | Support email link |
| **Help Center** | `src/shared/components/help/HelpCenter.tsx` | AI chat explainer · Support email · Attribution footer |
| **AI Support Chat** | `src/shared/components/support/SupportChatWidget.tsx` | Floating bottom-left chat; falls back to support email |

---

> **NYSC Facilities Hub** — Built for internal use by New York State court staff.
> Version 1.0.0 · Created January 2024 · Last updated March 2026
> Built by Jack Duchatelier · nyscfacilitieshub@gmail.com
