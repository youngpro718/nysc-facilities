# Front-End Specification

## NYSC Facilities Management System

---
# Front-End Spec — NYSC Facilities Hub

## Routes (MVP)
- `/` (dashboard)
- `/facilities` (list/table + filters)
- `/facilities/:id` (detail w/ status, capacity, schedule)
- `/ops` (action center)

## Component Layers
- `app/routes/*` — route/page shells & layout
- `features/*` — domain logic (facilities, ops, users)
- `services/*` — all fetch/supabase calls
- `ui/*` — generic components (buttons, inputs, tables)
- `shared/*` — hooks, utils, constants, types

## State
- Server state via React Query (or equivalent)
- Local state minimal & scoped
- No direct data calls from components (use services)

## Patterns
- Loading/empty/error states standardized
- Form schema validation (zod/yup) in features
- Audit on write actions
