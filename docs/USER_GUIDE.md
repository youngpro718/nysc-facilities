# NYSC Facilities Hub — User Guide

> Last updated: February 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Roles & Permissions](#2-roles--permissions)
3. [Admin Dashboard](#3-admin-dashboard)
4. [Spaces Management](#4-spaces-management)
5. [Operations Center](#5-operations-center)
6. [Access & Assignments](#6-access--assignments)
7. [Keys Management](#7-keys-management)
8. [Inventory Management](#8-inventory-management)
9. [Lighting Management](#9-lighting-management)
10. [Court Operations](#10-court-operations)
11. [Tasks & Supply Room](#11-tasks--supply-room)
12. [User Dashboard & My Activity](#12-user-dashboard--my-activity)
13. [Admin Center & System Settings](#13-admin-center--system-settings)
14. [Profile & Settings](#14-profile--settings)
15. [FYIs & Tips](#15-fyis--tips)

---

## 1. Getting Started

### Logging In
Navigate to the app URL. You'll see the login screen. Sign in with your court email credentials. First-time users will go through an onboarding flow and must be approved by an admin before gaining access.

### After Login
You'll be routed to the dashboard matching your role:
- **Admin** → Admin Dashboard (`/`)
- **CMC** (Court Management Coordinator) → CMC Dashboard (`/cmc-dashboard`)
- **Court Aide / Supply Staff** → Supply Staff Dashboard (`/court-aide-dashboard`)
- **Standard User** → User Dashboard (`/dashboard`)

### Navigation
The sidebar shows only the pages your role can access. Use it to move between modules. Breadcrumbs at the top of each page show where you are.

---

## 2. Roles & Permissions

| Role | Access Level | Key Capabilities |
|------|-------------|-----------------|
| **Admin** | Full access | All modules, user management, system settings |
| **CMC** | Court operations | Court operations, term management, personnel |
| **Court Aide** | Supply-focused | Tasks, supply room, inventory |
| **Standard User** | Self-service | Dashboard, submit requests, report issues, view activity |

**FYI:** Module access is also controlled by feature flags. An admin can enable/disable specific modules per role from the Admin Center.

---

## 3. Admin Dashboard

**Route:** `/`  
**Access:** Admin only

The main hub showing a high-level overview of the entire facility.

### What You'll See
- **Stats cards** — Key counts (open issues, pending requests, active keys, etc.)
- **Pending approvals** — Items needing your attention (supply requests, key requests, user registrations)
- **Quick actions** — Jump to common tasks

### How to Use
- Click any stat card to jump to that module's detail view
- Approval badges show counts — click to go directly to the approval queue
- Notifications bell (top right) shows real-time alerts

---

## 4. Spaces Management

**Route:** `/spaces`  
**Access:** Admin only

Manage the physical hierarchy: **Buildings → Floors → Rooms & Hallways**.

### Features
- **Building list** — View all buildings
- **Floor browser** — Select a building, then browse floors
- **Room management** — Create, edit, archive rooms
- **Floor plans** — 2D (ReactFlow) and 3D (Three.js) visualization
- **Room details** — Capacity, ceiling height, bulb type, occupants, assignments

### How to Add a Room
1. Go to `/spaces`
2. Click the **"+"** button
3. Fill in room details (name, number, floor, type)
4. Save

### How to View Floor Plans
1. Select a building and floor
2. Click the **"Floor Plan"** tab
3. Toggle between 2D and 3D views
4. Use filters (All / Rooms / Hallways / Doors) to focus the view
5. In 3D: use mouse to orbit, scroll to zoom, click objects to inspect

**FYI:** Floor plans auto-layout if objects don't have saved positions. You can drag objects in 2D to arrange them, and positions will persist.

---

## 5. Operations Center

**Route:** `/operations`  
**Access:** Admin and authorized roles

The consolidated hub for facility issues, maintenance, and supply request oversight.

### Tabs
- **Issues** — All reported facility problems (plumbing, electrical, HVAC, etc.)
- **Maintenance** — Scheduled and reactive maintenance work
- **Supply Requests** — Overview of all supply requests across the system

### Managing Issues
1. Click any issue card to open details
2. Change **status** (open → in_progress → resolved → closed)
3. Change **priority** (low / medium / high / critical)
4. Add **notes** and **resolution details**
5. Assign to a department or person

### Reporting an Issue (Admin)
1. Click **"Report Issue"**
2. Select type, location (building/floor/room), priority
3. Add description and optional photos
4. Submit — it appears in the issues list immediately

**FYI:** Issues can also be created automatically when lighting fixtures are marked as needing maintenance. Legacy routes `/issues` and `/maintenance` redirect here.

---

## 6. Access & Assignments

**Route:** `/access-assignments`  
**Access:** Admin only

Manage personnel, room assignments, and key assignments in one place.

### Features
- **Personnel directory** — Search and filter all court personnel
- **Room assignments** — Assign people to rooms, track occupancy
- **Key assignments** — See who has which keys
- **Bulk operations** — Export/import CSV

### How to Assign a Room
1. Find the person in the directory
2. Click their card → **"Assign Room"**
3. Select building, floor, room
4. Save

**FYI:** The old `/occupants` route redirects here. This is the consolidated view that replaced the separate Occupants page.

---

## 7. Keys Management

**Route:** `/keys`  
**Access:** Admin only

Track physical keys — inventory, requests, orders, assignments, and audit logs.

### Tabs
- **Inventory** — All keys in the system with status
- **Requests** — Pending key requests from users
- **Orders** — Key orders placed with vendors
- **Assignments** — Who currently holds which key
- **History** — Full audit log of key movements

### Processing a Key Request
1. Go to **Requests** tab
2. Review the request details (who, which key, reason)
3. Click **Approve** or **Reject**
4. If approved, the key is automatically assigned to the requester

### Creating a Key
1. Click **"Create Key"**
2. Enter key details (type, number, building, notes)
3. Save — it appears in inventory as available

**FYI:** Users request keys from their dashboard via the public key request form. Admins process those requests here.

---

## 8. Inventory Management

**Route:** `/inventory`  
**Access:** Admin, Court Aide

Track supplies and materials — stock levels, categories, reorder points.

### Features
- **Stock tracking** — Real-time quantity for every item
- **Low stock alerts** — Automatic warnings when items drop below threshold
- **Categories** — Organized by type (office supplies, cleaning, etc.)
- **Reorder recommendations** — Smart suggestions based on usage
- **Analytics** — Usage trends and cost tracking
- **Export** — Download inventory as CSV

### How to Add an Item
1. Click **"Add Item"**
2. Fill in name, category, quantity, reorder point, unit cost
3. Save

### How to Update Stock
1. Find the item (search or browse)
2. Click the item → edit quantity
3. Save — the change is logged

**FYI:** Low stock alerts appear on the Admin Dashboard and in notifications. Set reorder points carefully to avoid false alarms.

---

## 9. Lighting Management

**Route:** `/lighting`  
**Access:** Admin only

Visual management of all lighting fixtures across the facility. Designed for quick walkthrough inspections.

### Layout: 2 Tabs

#### Dashboard Tab
- **Health metrics** — Overall fixture health percentage
- **Stats cards** — Total fixtures, working, out, ballast issues
- **Issues list** — Fixtures needing attention

#### Floor View Tab
The primary inspection tool. Shows every floor as an expandable accordion.

### How to Inspect Lighting (Floor View)
1. Click **"Floor View"** tab
2. Expand a floor to see all hallway sections
3. Each hallway shows a **visual grid of dots**:
   - 🟢 **Green** = Working
   - 🔴 **Red** = Out
   - 🟡 **Amber** = Ballast issue
4. **Tap any dot** to cycle its status: Working → Out → Ballast → Working
5. Changes save instantly (optimistic updates — you see it change immediately)

### How to Add a Hallway Section
1. Expand a floor in Floor View
2. Click **"+ Add Section to [Floor Name]"** at the bottom
3. In the dialog:
   - **Section Name** — Type freely, or tap a direction preset (North, South, Southwest, etc.) to auto-fill
   - **Number of Fixtures** — How many lights are in this section (1-100)
   - **Bulb Technology** — LED, Fluorescent, or Bulb
4. Click **"Add [N] Fixtures"** — the section appears immediately with all green dots

### Walkthrough Mode
For each hallway, click **"Walkthrough"** to step through fixtures one by one in sequence. Useful for physical inspections where you walk the hallway and mark each light.

### Status Definitions
| Status | Meaning | Color | DB Value |
|--------|---------|-------|----------|
| Working | Fixture is operational | Green | `functional` |
| Out | Fixture is not working | Red | `non_functional` |
| Ballast | Ballast needs replacement | Amber | `maintenance_needed` |

**FYI:** The old Reports, Rooms, Hallways, and Issues tabs have been removed. The Dashboard + Floor View covers everything you need. If you need room-level fixture data, check the Spaces module.

---

## 10. Court Operations

**Route:** `/court-operations`  
**Access:** Admin, CMC

Manage courtroom operations — daily sessions, term assignments, personnel, and shutdowns.

### Features
- **Today's Status** — Live dashboard of all courtroom statuses for the day
- **Daily Sessions** — Track which courts are in session, adjourned, or dark
- **Term Sheet Board** — View and manage the criminal term assignment sheet
- **Staff Absence Manager** — Track staff absences and coverage
- **Personnel assignments** — Assign judges and staff to courtrooms
- **Room shutdowns** — Track courtrooms under maintenance
- **Upload Daily Report** — Upload and parse daily court reports (PDF)

### How to Upload a Term Sheet
1. Click **"Upload Term"** or **"Upload Daily Report"**
2. Select the PDF file
3. The system parses it and populates the term sheet board

### How to Assign Personnel
1. Go to the **Assignments** section
2. Use the dropdowns to select judge/staff for each courtroom
3. Changes save automatically

### Judge Management
- **Move Judge to Part** — Reassign a judge to a different courtroom
- **Edit Judge Details** — Update contact info, status
- **Swap Chambers** — Exchange two judges' chamber assignments
- **Track Departures** — Record when judges leave and process reassignments

### Live Court Grid
**Route:** `/court-live`  
**Access:** Admin only  
A real-time visual grid showing all courtroom statuses at a glance.

**FYI:** The CMC role sees a focused view of court operations. They can manage term assignments and personnel but don't have access to facility management modules.

---

## 11. Tasks & Supply Room

### Tasks
**Route:** `/tasks`  
**Access:** Court Aide and authorized roles

Task management for supply staff and operational tasks.

- View assigned tasks
- Claim available tasks
- Update task status and add notes
- Tasks can be created by admins or generated from supply requests

### Supply Room
**Route:** `/supply-room`  
**Access:** Court Aide and authorized roles

The fulfillment center for supply requests.

- **Claim requests** — Pick up a supply request to fulfill
- **Process orders** — Mark items as picked, packed, delivered
- **Check inventory** — Verify stock before fulfilling
- **Track status** — Full lifecycle from submitted → approved → picking → ready → completed

### How to Fulfill a Supply Request
1. Go to Supply Room
2. Find a request with status **"Approved"**
3. Click **"Claim"** to assign it to yourself
4. Pick the items, update status to **"Picking"** → **"Ready"**
5. Deliver and mark as **"Completed"**

**FYI:** The old `/supplies` route redirects to `/tasks`. Supply requests submitted by users flow through admin approval before reaching the supply room.

---

## 12. User Dashboard & My Activity

### User Dashboard
**Route:** `/dashboard`  
**Access:** All authenticated users

Your personal overview showing:
- Quick action buttons (request supplies, report issue, request key)
- Your pending requests and their statuses
- Recent notifications

### My Activity
**Route:** `/my-activity`  
**Access:** All authenticated users

A unified view of everything you've submitted:
- **Key requests** — Status of your key requests
- **Supply requests** — Status of your supply orders
- **Issues** — Problems you've reported and their resolution status

### How to Request Supplies
1. From your dashboard, click **"Request Supplies"** (or go to `/request/supplies`)
2. Browse available items
3. Add items to your request with quantities
4. Add justification notes
5. Submit — it goes to admin for approval

### How to Report an Issue
1. From your dashboard, click **"Report Issue"**
2. Select issue type and location
3. Describe the problem
4. Submit — it appears in the Operations Center for admin review

**FYI:** Legacy routes `/my-requests`, `/my-issues`, and `/my-supply-requests` still work but redirect to the consolidated My Activity page.

---

## 13. Admin Center & System Settings

### Admin Center
**Route:** `/admin`  
**Access:** Admin only

Manage users, roles, and team settings.

- **User management** — Approve new registrations, edit roles, deactivate accounts
- **Pending approvals** — New user registrations awaiting approval
- **Role assignment** — Set user roles (admin, cmc, court_aide, user)
- **Module access** — Enable/disable specific modules per user

### System Settings
**Route:** `/system-settings`  
**Access:** Admin only

Global application configuration.

### Access Management
**Route:** `/access-management`  
**Access:** Admin only

Fine-grained access control and permission management.

### Notifications
**Route:** `/notifications`  
**Access:** Admin only

View and manage system notifications.

### Form Templates & Routing
- **Form Templates** (`/form-templates`, `/admin/form-templates`) — Manage form layouts
- **Routing Rules** (`/admin/routing-rules`) — Configure where form submissions are routed

**FYI:** When a new user registers, they enter a "pending approval" state. They'll see a waiting screen until an admin approves them from the Admin Center. Rejected users see a rejection notice.

---

## 14. Profile & Settings

**Route:** `/profile`  
**Access:** All authenticated users

Your personal profile and app settings.

- **Profile info** — Name, email, department, title
- **Settings tab** — Theme (light/dark), notification preferences
- **Security** — Password change, session management

**FYI:** The old `/settings` routes all redirect to `/profile?tab=settings`. Theme changes apply immediately.

---

## 15. FYIs & Tips

### General
- **Auto-save** — Most forms and status changes save automatically. You'll see a toast notification confirming the save.
- **Real-time updates** — Notifications and some data update in real-time via WebSocket. No need to refresh.
- **Search** — Most list views have a search bar. Use it — it searches across multiple fields.
- **Keyboard shortcuts** — None currently. All interactions are click/tap based.

### Data & Performance
- **Caching** — Data is cached locally. If something looks stale, navigate away and back. Do NOT rely on browser refresh — the app manages its own cache.
- **Offline** — The app requires an internet connection. There is no offline mode.
- **Exports** — Most list views support CSV export. Look for the "Export" button.

### Mobile
- The app is responsive and works on tablets and phones.
- Lighting Floor View is optimized for tablet use during walkthroughs — tap dots with your finger.
- Some admin features are best used on desktop for complex tables and forms.

### Troubleshooting
| Problem | Solution |
|---------|----------|
| Page won't load | Check your internet connection. Try navigating to another page and back. |
| Data looks stale | Navigate away and return. Do NOT hard-refresh the browser. |
| Can't access a page | Check your role — you may not have permission. Ask an admin. |
| Form submission fails | Check for red validation errors. All required fields must be filled. |
| Lighting dots don't update | Make sure you're logged in. The toggle requires authentication. |
| "Pending Approval" screen | Your account hasn't been approved yet. Contact an admin. |

### For Admins
- **New user flow:** User registers → sees "Pending Approval" → Admin approves in Admin Center → User gains access
- **Module toggles:** You can disable entire modules (lighting, court ops, etc.) from System Settings
- **Audit trail:** Key assignments, issue status changes, and supply request actions are all logged
- **Database:** Backend is Supabase (PostgreSQL). Row Level Security (RLS) is enabled on all tables.
- **Backups:** Supabase handles automatic daily backups. Point-in-time recovery is available on paid plans.

---

## Quick Reference: All Routes

### Admin Routes
| Route | Page | Module |
|-------|------|--------|
| `/` | Admin Dashboard | — |
| `/spaces` | Spaces Management | spaces |
| `/operations` | Operations Center | operations |
| `/access-assignments` | Access & Assignments | occupants |
| `/keys` | Keys Management | keys |
| `/inventory` | Inventory Management | inventory |
| `/lighting` | Lighting Management | lighting |
| `/court-operations` | Court Operations | court_operations |
| `/court-live` | Live Court Grid | court_operations |
| `/admin` | Admin Center | — |
| `/system-settings` | System Settings | — |
| `/access-management` | Access Management | — |
| `/notifications` | Notifications | — |
| `/admin/key-requests` | Key Request Admin | keys |
| `/admin/supply-requests` | Supply Request Admin | supply_requests |
| `/admin/routing-rules` | Form Routing Rules | — |
| `/admin/form-templates` | Form Templates Admin | — |

### User Routes
| Route | Page |
|-------|------|
| `/dashboard` | User Dashboard |
| `/my-activity` | My Activity (requests, issues) |
| `/request/supplies` | Supply Request Form |
| `/request/help` | Help Request |
| `/supply-room` | Supply Room (Court Aide) |
| `/tasks` | Task Management (Court Aide) |
| `/profile` | Profile & Settings |
| `/term-sheet` | Criminal Term Sheet |

### Legacy Redirects
| Old Route | Redirects To |
|-----------|-------------|
| `/occupants` | `/access-assignments` |
| `/admin-profile` | `/admin` |
| `/issues` | `/operations?tab=issues` |
| `/maintenance` | `/operations?tab=maintenance` |
| `/supplies` | `/tasks` |
| `/supply-requests` | `/my-activity` |
| `/settings` | `/profile?tab=settings` |
