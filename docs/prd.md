# Product Requirements Document (PRD)

## NYSC Facilities Management System

---

## 📚 Comprehensive Documentation Available

This application has been fully analyzed and documented. For complete information, see:

### **Main Documentation**
- **[Brownfield Analysis](./BROWNFIELD_ANALYSIS.md)** - Complete system overview, architecture, and assessment
- **[Quick Reference Guide](./QUICK_REFERENCE.md)** - Developer guide with URLs, navigation, and common tasks
- **[Architecture Diagrams](./ARCHITECTURE_DIAGRAM.md)** - Technical architecture and data flow diagrams
- **[Workflow Summary](./WORKFLOW_SUMMARY.md)** - Brownfield workflow execution report

### **Quick Links**
- **Application Status:** Production-Ready (Grade: A- / 90/100)
- **Development Server:** http://localhost:8080
- **Production URL:** https://nysc-facilities.windsurf.build
- **Repository:** https://github.com/youngpro718/nysc-facilities.git

---
# Product Requirements — NYSC Facilities Hub (Brownfield)

## Problem
Court ops staff need a single, reliable system to view/update room status, schedules, capacity, and logistics (lighting, AV, key access, cleaning, DCAS requests) across 100/111 Centre.

## Goals (MVP, 4 weeks)
- Stable DB model + migrations (Supabase) for Rooms, Schedules, Capacities, Keys, Tickets.
- Clear UI routes and component structure; remove UI/data coupling.
- One end-to-end Ops flow (view room → update status → log action) with audit trail.

## Non-Goals (now)
- Advanced analytics; multi-tenant.

## Users & Roles
- Facilities Coordinator (full read/write)
- Sergeant/Clerk (limited updates)
- IT/DCAS (read; targeted updates)

## Success
- < 30s to locate a room and act
- < 5% data errors on updates
- Core routes 99.9% available

## Initial Epics
1. **Schema Stabilization** (Supabase)  
2. **UI Architecture & Routes** (React/Vite/Tailwind)  
3. **Ops Module v1** (room view → update → log)  
4. **Docs & Handoff** (README, PRD, Arch, UI spec)

## Initial Stories (ready to break down)
- Create/align tables: rooms, schedules, capacities, keys, tickets, audit_log
- Define routes: `/`, `/facilities`, `/facilities/:id`, `/ops`
- Implement room card → detail view; update status action with audit
