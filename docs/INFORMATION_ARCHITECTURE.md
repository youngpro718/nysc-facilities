# NYSC Facilities Management System - Information Architecture

**Version:** 1.0.0  
**Last Updated:** October 25, 2025  
**Status:** Active Development

---

## 📋 Quick Reference

**Purpose:** Comprehensive facilities management system for New York State Court facilities  
**Tech Stack:** React 18 + TypeScript 5.9 + Vite 7.1 + Supabase 2.53  
**Architecture:** Layered (UI → Hooks → Services → Database)  
**Security:** RBAC with 5 roles + Row-Level Security (RLS)  
**Current Phase:** Epic 003 complete, ready for UI implementation

---

## 🎯 System Overview

### Core Capabilities
- **Facilities Management** - Buildings, floors, rooms (1000+ rooms, 32 buildings)
- **Operations Management** - Issues, maintenance, status tracking with audit trail
- **Personnel Management** - Occupants, assignments, court personnel
- **Resource Management** - Keys, inventory, supply requests
- **Court Operations** - Courtroom scheduling, terms, assignments
- **Audit & Compliance** - Complete audit trail, RBAC enforcement

### Technology Stack
```
Frontend:  React 18.2 + TypeScript 5.9 + Vite 7.1
UI:        Tailwind CSS 3.4 + Shadcn/ui (Radix UI)
State:     React Query 5.84 + Zustand 5.0
Backend:   Supabase 2.53 (PostgreSQL + Auth)
3D:        Three.js 0.162 + React Three Fiber 8.18
```

---

## 🏗️ Architecture Layers

### Layer 1: UI Components (`src/components/`)
**Responsibility:** Display data, handle user interactions  
**Pattern:** Presentational components, delegate to hooks  
**Key Directories:** `layout/`, `spaces/`, `operations/`, `supply/`, `ui/`

### Layer 2: Application Logic (`src/hooks/`)
**Responsibility:** Business logic, state management, permission checks  
**Pattern:** Custom React hooks with React Query  
**Key Hooks:** `usePermissions`, `useRoomStatusUpdate`, `useAuditTrail`

### Layer 3: Service Layer (`src/services/`)
**Responsibility:** Database operations, API calls, data transformation  
**Pattern:** Single Supabase client, service modules per domain  
**Key Services:** `facilitiesService`, `operationsService`

### Layer 4: Database (PostgreSQL via Supabase)
**Responsibility:** Data persistence, security (RLS), business rules  
**Migrations:** 10 SQL files in `db/migrations/`  
**Security:** Row-level security on all tables

---

## 🎨 Core Domains

### 1. Facilities Domain
**Entities:** Buildings, Floors, Rooms, Hallways, Doors  
**Routes:** `/spaces`, `/facilities`, `/facilities/:id`  
**Features:** Spatial hierarchy, capacity tracking, status management, 3D visualization

### 2. Operations Domain
**Entities:** Issues, Maintenance, Supply Requests, Room Status  
**Routes:** `/ops`, `/operations`  
**Features:** Issue tracking, status workflow, audit trail, RBAC enforcement  
**Flow:** Read room → Update status → Write audit log → Refresh view

### 3. Personnel Domain
**Entities:** Profiles, Occupants, Court Personnel  
**Routes:** `/occupants`, `/profile`, `/admin-profile`  
**Features:** User auth, room assignments, role-based access

### 4. Resources Domain
**Entities:** Keys, Key Assignments, Inventory, Supply Requests  
**Routes:** `/keys`, `/inventory`, `/supply-room`  
**Features:** Key tracking, inventory management, stock alerts

### 5. Court Operations Domain
**Entities:** Courtrooms, Court Terms, Court Assignments  
**Routes:** `/court-operations`  
**Features:** Courtroom availability, term scheduling, personnel assignments

---

## 👥 User Roles & Permissions

### Role Hierarchy
```
Administrator → Manager → Facilities Staff → Staff → User
```

### Permission Matrix

| Action | Admin | Manager | Facilities Staff | Staff | User |
|--------|:-----:|:-------:|:----------------:|:-----:|:----:|
| View Details | ✅ | ✅ | ✅ | ✅ | Own |
| Update Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Facility | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Audit | ✅ | ✅ | ✅ | ❌ | ❌ |

### Implementation
```typescript
// src/lib/permissions.ts - Configuration
export const PERMISSIONS = {
  'facility.update_status': ['administrator', 'manager', 'facilities_staff'],
  'audit.view': ['administrator', 'manager', 'facilities_staff'],
  // ... more permissions
};

// Usage in components
const { can } = usePermissions();
if (!can('facility.update_status')) return null;
```

---

## 🗄️ Data Model

### Spatial Hierarchy
```
buildings (32 total)
  ↓
floors (multiple per building)
  ↓
rooms (1000+ rooms)
```

### Key Tables
- `buildings`, `floors`, `rooms` - Spatial hierarchy
- `profiles`, `occupants` - Personnel
- `issues`, `audit_logs` - Operations
- `keys`, `key_assignments` - Resources
- `inventory_items`, `supply_requests` - Inventory

### Enums
- `room_status_enum`: available, occupied, maintenance, reserved, closed
- `issue_status_enum`: pending, in_progress, resolved, closed
- `issue_priority_enum`: low, medium, high, urgent
- `user_role_enum`: administrator, manager, facilities_staff, staff, user

---

## 📁 Application Structure

```
nysc-facilities-main/
├── src/
│   ├── pages/ (49 files)           # Route components
│   ├── components/ (982 files)     # UI components
│   ├── hooks/ (86 files)           # Custom hooks
│   ├── services/ (23 files)        # Service layer
│   ├── lib/ (9 files)              # Utilities + RBAC
│   ├── providers/ (5 files)        # Context providers
│   └── types/ (11 files)           # TypeScript types
│
├── docs/
│   ├── epics/ (3 files)            # Epic documents
│   ├── stories/ (13 files)         # User stories
│   ├── qa/ (2 files)               # QA checklists
│   ├── front-end-spec.md           # Frontend spec
│   ├── brownfield-analysis.md      # System analysis
│   └── INFORMATION_ARCHITECTURE.md # This document
│
├── db/
│   ├── README.md                   # Migration guide
│   └── migrations/ (10 files)      # SQL migrations
│
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite config (port 8080)
└── tailwind.config.ts              # Tailwind config
```

---

## 🗺️ Navigation & Routes

### Primary Routes
```
/ (admin dashboard)
/dashboard (user dashboard)
/spaces (facilities management)
/facilities (facilities list)
/facilities/:id (facility detail)
/ops (operations hub)
/occupants (personnel)
/keys (key management)
/inventory (inventory)
/supply-room (supply room)
/court-operations (court ops)
/profile (user profile)
/admin-profile (admin profile)
/system-settings (system settings)
/login (authentication)
```

### Navigation Components
**Primary:** Dashboard, Spaces, Operations, Occupants, Court Operations, Profile  
**Secondary:** Keys, Inventory, Supply Room, System Settings  
**Role-Based:** Navigation filtered by user permissions

---

## 🗓️ Epic Roadmap

### Epic 001: Schema Stabilization ✅ COMPLETE
**Deliverables:** 10 SQL migrations, database README, 8 stories  
**Impact:** Production-ready schema, audit framework, RLS, performance optimization  
**Docs:** [`docs/epics/epic-001-schema-stabilization.md`](epics/epic-001-schema-stabilization.md)

### Epic 002: UI Architecture ✅ COMPLETE
**Deliverables:** Frontend spec, service layer, route shells, QA checklist  
**Impact:** Clean architecture, enforced patterns, improved maintainability  
**Docs:** [`docs/epics/epic-002-ui-architecture.md`](epics/epic-002-ui-architecture.md)

### Epic 003: Operations Module v1 ✅ COMPLETE
**Story Points:** 20 | **Duration:** 3 weeks  
**Deliverables:** RBAC system, Ops v1 flow, React Query hooks, 25+ tests, QA checklist  
**Impact:** Production-ready ops module, complete RBAC, automatic audit logging  
**Docs:** [`docs/epics/epic-003-ops-module-v1.md`](epics/epic-003-ops-module-v1.md)

### Epic 004: UI Components 🔜 PLANNED
**Story Points:** 15 | **Target:** Sprint 7-8  
**Scope:** RoomDetailPanel, StatusUpdateModal, AuditTrailList, toast system

### Epic 005: Integration Testing 🔜 PLANNED
**Story Points:** 10 | **Target:** Sprint 9  
**Scope:** E2E tests, integration tests, performance, accessibility

### Epic 006: Advanced Features 🔜 PLANNED
**Story Points:** 25 | **Target:** Sprint 10-12  
**Scope:** Real-time notifications, advanced search, bulk ops, reporting

---

## 🔄 Development Workflow

### Process Flow
```
1. Epic Planning → Define scope, break into stories, estimate
2. Story Development → Write story, define criteria, design approach
3. Implementation → Database → Service → Hooks → Components → Tests
4. Testing & QA → Unit tests, integration tests, QA checklist, manual testing
5. Documentation → Update README, API docs, user guides
6. Deployment → Code review, merge, deploy staging, deploy production
```

### Git Workflow
```
main (production)
  ↓
feat/epic-001-schema
  ↓
feat/epic-002-ui-architecture
  ↓
feat/epic-003-ops-v1 (current)
```

**Branch Naming:** `feat/epic-XXX-name`, `fix/issue-description`, `docs/update-description`  
**Commit Format:** `BMAD: Epic XXX — <summary>`

---

## 📊 Key Metrics

### Codebase
- **Total Files:** 1,400+
- **Lines of Code:** ~50,000
- **Components:** 982
- **Hooks:** 86
- **Services:** 23
- **Tests:** 25+ (growing)

### Database
- **Tables:** 30+
- **Views:** 10+
- **Functions:** 15+
- **RLS Policies:** 50+
- **Migrations:** 10

### Documentation
- **Epics:** 3 complete
- **Stories:** 13 complete
- **QA Checklists:** 2
- **Total Lines:** 3,500+

---

## 🎯 Success Criteria

### Technical Excellence
✅ Clean architecture with separation of concerns  
✅ Comprehensive RBAC implementation  
✅ Complete audit trail for all operations  
✅ Type-safe TypeScript throughout  
✅ Responsive design (mobile, tablet, desktop)  
✅ Accessibility (WCAG 2.1 Level AA)

### Performance
✅ Page load < 2s  
✅ Status update < 500ms  
✅ Optimistic updates for instant feedback  
✅ Efficient query caching with React Query

### Security
✅ Row-level security (RLS) on all tables  
✅ Multi-layer permission checks  
✅ Secure authentication via Supabase Auth  
✅ SQL injection prevention  
✅ XSS protection

---

## 🚀 Getting Started

### For Developers
```bash
# Clone and install
git clone https://github.com/youngpro718/nysc-facilities.git
cd nysc-facilities
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# Run development server
npm run dev  # Opens on http://localhost:8080

# Run tests
npm test
```

### For Product Managers
1. Review epic documents in [`docs/epics/`](epics/)
2. Check user stories in [`docs/stories/`](stories/)
3. Monitor progress via GitHub pull requests
4. Review roadmap in this document

### For QA Engineers
1. Review QA checklists in [`docs/qa/`](qa/)
2. Set up test environment (follow developer setup)
3. Create test user accounts (all 5 roles)
4. Execute test scenarios from QA checklists

---

## 📞 Support & Resources

### Documentation
- **This Document:** Overview and architecture
- **Epic Documents:** [`docs/epics/`](epics/) - High-level planning
- **User Stories:** [`docs/stories/`](stories/) - Detailed requirements
- **QA Checklists:** [`docs/qa/`](qa/) - Testing procedures
- **Database Guide:** [`db/README.md`](../db/README.md) - Schema and migrations
- **Frontend Spec:** [`docs/front-end-spec.md`](front-end-spec.md) - UI standards

### Code References
- **Service Layer:** [`src/services/`](../src/services/) - Data access patterns
- **Hooks:** [`src/hooks/`](../src/hooks/) - Business logic patterns
- **Components:** [`src/components/`](../src/components/) - UI patterns
- **Permissions:** [`src/lib/permissions.ts`](../src/lib/permissions.ts) - RBAC config

### External Resources
- **React Query:** https://tanstack.com/query/latest
- **Supabase:** https://supabase.com/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Last Updated:** October 25, 2025  
**Maintained By:** Development Team  
**Version:** 1.0.0
