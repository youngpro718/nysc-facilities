# NYSC Facilities Hub — Quick Reference

> For the full user guide, see [USER_GUIDE.md](./USER_GUIDE.md)

## Application URLs

### Development
- **Local:** http://localhost:8080

### Production
- **Live Site:** https://nysc-facilities.windsurf.build
- **Netlify Dashboard:** https://app.netlify.com/projects/nysc-facilities-s8u8g

---

## Page Navigation Map

### Admin Routes (Require Admin Role)
```
/ ........................... Admin Dashboard (Main hub)
/spaces ..................... Spaces Management (Buildings, floors, rooms)
/operations ................. Operations Center (Issues, maintenance, supplies)
/access-assignments ......... Access & Assignments (Personnel, rooms, keys)
/court-operations ........... Court Operations (Terms, assignments, shutdowns)
/court-live ................. Live Court Grid
/keys ....................... Keys Management (Inventory, requests, orders)
/inventory .................. Inventory Management (Stock, categories, analytics)
/lighting ................... Lighting Management (Dashboard + Floor View)
/admin ...................... Admin Center (Users, roles, approvals)
/system-settings ............ System Configuration
/access-management .......... User Access Control
/notifications .............. Notifications
/admin/key-requests ......... Key Request Admin
/admin/supply-requests ...... Supply Request Admin
/admin/routing-rules ........ Form Routing Rules
/admin/form-templates ....... Form Templates Admin
```

### Role-Specific Dashboards
```
/cmc-dashboard .............. CMC Dashboard (Court Management Coordinator)
/court-aide-dashboard ....... Supply Staff Dashboard (Court Aide)
/purchasing-dashboard ....... Purchasing Dashboard
```

### User Routes (All Authenticated Users)
```
/dashboard .................. User Dashboard (Personal overview)
/my-activity ................ My Activity (Requests, issues, supply orders)
/request/supplies ........... Supply Request Form
/request/help ............... Help Request
/profile .................... Profile & Settings
/term-sheet ................. Criminal Term Sheet
```

### Staff Routes (Court Aide / Supply)
```
/tasks ...................... Task Management
/supply-room ................ Supply Room (Fulfillment)
/inventory .................. Inventory Management
```

### Public Routes (No Login Required)
```
/public-forms ............... Public Form Directory
/forms/key-request .......... Key Request Form
/request/supplies ........... Supply Request Form
/forms/maintenance-request .. Maintenance Request Form
/forms/issue-report ......... Issue Report Form
```

### Legacy Redirects
```
/occupants → /access-assignments
/admin-profile → /admin
/issues → /operations?tab=issues
/maintenance → /operations?tab=maintenance
/supplies → /tasks
/supply-requests → /my-activity
/settings → /profile?tab=settings
/my-requests → (still works, legacy)
/my-issues → (still works, legacy)
```

---

## Key Features by Module

| Module | Key Features |
|--------|-------------|
| **Spaces** | Buildings → Floors → Rooms, 2D/3D floor plans, room assignments |
| **Operations** | Issues tracking, maintenance scheduling, supply request oversight |
| **Access & Assignments** | Personnel directory, room assignments, key assignments, CSV export |
| **Court Operations** | Daily sessions, term sheet board, judge management, staff absences, live grid |
| **Keys** | Inventory, requests, orders, assignments, audit logs |
| **Inventory** | Stock tracking, low stock alerts, categories, reorder recommendations |
| **Lighting** | Dashboard + Floor View, tap-to-toggle fixtures, add sections, walkthrough mode |
| **Supply Room** | Request fulfillment, status tracking, inventory integration |
| **Tasks** | Task assignment, claiming, status updates |

---

## Roles & Permissions

| Role | Dashboard | Access |
|------|-----------|--------|
| **Admin** | `/` | All modules, user management, system settings |
| **CMC** | `/cmc-dashboard` | Court operations, term management, personnel |
| **Court Aide** | `/court-aide-dashboard` | Tasks, supply room, inventory |
| **User** | `/dashboard` | Submit requests, report issues, view activity |
| **Public** | — | Public forms only (no login) |

---

## Database Quick Reference

### Core Tables
```
buildings → floors → rooms/hallways → lighting_fixtures
profiles, personnel_profiles
keys, key_assignments, key_requests, key_orders
inventory_items, supply_requests, supply_request_items
court_rooms, court_assignments, court_terms, room_shutdowns
issues, staff_tasks
```

### Key Views
```
unified_spaces, key_inventory_view, personnel_profiles_view
unified_personnel_view, spaces_dashboard_mv
```

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:8080)
npm run build        # Production build → dist/
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm test             # Run tests
```

Deploy: automatic on `git push origin main` (Netlify)

---

## Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** — Complete feature guide with how-tos and FYIs
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** — Environment configuration
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** — System architecture
- **[RBAC_STRATEGY.md](./RBAC_STRATEGY.md)** — Role-based access control details
- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** — Security guidelines
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** — Testing approach
- **[PRODUCTION_READY_CHECKLIST.md](./PRODUCTION_READY_CHECKLIST.md)** — Deployment checklist

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Repository
- **GitHub:** https://github.com/youngpro718/nysc-facilities.git

---

**Last Updated:** February 2026
