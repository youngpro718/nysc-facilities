# RLS Policy Matrix - Role × Table Permissions

**Generated:** March 20, 2026  
**Migration:** 052_audit_rls_policies.sql

This document maps which roles can perform which operations on each table.

## Legend

- ✅ **Full Access** - Can read, create, update, delete
- 📖 **Read** - Can only view records
- 📝 **Read + Own Write** - Can view all, modify own records
- 🔒 **No Access** - Cannot access table
- ⚠️ **Conditional** - Access depends on specific conditions

---

## Core Tables

### Issues

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | 🔒 | Can manage issues |
| cmc | ✅ | ✅ | 📝 | 🔒 | Can report, update own |
| court_officer | ✅ | ✅ | ✅ | 🔒 | Can manage issues |
| court_aide | ✅ | ✅ | ✅ | 🔒 | Can manage issues |
| purchasing | ✅ | ✅ | 📝 | 🔒 | Can report, update own |
| standard | ✅ | ✅ | 📝 | 🔒 | Can report, update own |

**Policy:** All users can report issues. Issue managers (admin, facilities_manager, court_officer, court_aide) can update/assign any issue. Only admins can delete.

---

### Supply Requests

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| cmc | 📖 | 📝 | 📝 | 🔒 | Own requests only |
| court_officer | 📖 | 📝 | 📝 | 🔒 | Own requests only |
| court_aide | ✅ | ✅ | ✅ | 🔒 | Can manage all requests |
| purchasing | 📖 | 📝 | 📝 | 🔒 | Own requests only (Phase 9 TBD) |
| standard | 📖 | 📝 | 📝 | 🔒 | Own requests only |

**Policy:** Supply staff (admin, court_aide) can view/manage all requests. Other users can only view/manage their own requests (and only while in submitted/pending_approval status).

---

### Inventory Items

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_officer | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_aide | ✅ | ✅ | ✅ | ✅ | Can manage inventory |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only (Phase 9 TBD) |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view inventory. Supply staff (admin, court_aide) can manage inventory.

---

### Keys

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage keys |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_officer | ✅ | ✅ | ✅ | ✅ | Can manage keys |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view keys. Key managers (admin, facilities_manager, court_officer) can manage keys.

---

### Key Assignments

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage assignments |
| cmc | 📝 | 🔒 | 🔒 | 🔒 | Own assignments only |
| court_officer | ✅ | ✅ | ✅ | ✅ | Can manage assignments |
| court_aide | 📝 | 🔒 | 🔒 | 🔒 | Own assignments only |
| purchasing | 📝 | 🔒 | 🔒 | 🔒 | Own assignments only |
| standard | 📝 | 🔒 | 🔒 | 🔒 | Own assignments only |

**Policy:** Users can view their own assignments. Key managers can view/manage all assignments.

---

## Spatial Tables

### Rooms

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage rooms |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only (FIXED in Phase 8) |
| court_officer | ✅ | ✅ | ✅ | ✅ | Can manage rooms (for lighting) |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view rooms. Building staff (admin, facilities_manager, court_officer) can manage rooms.

---

### Hallways

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage hallways |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_officer | ✅ | ✅ | ✅ | ✅ | Can manage hallways (for lighting) |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** Same as rooms.

---

### Buildings

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage buildings |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_officer | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view buildings. Only privileged users (admin, facilities_manager) can manage buildings.

---

### Floors

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage floors |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_officer | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** Same as buildings.

---

### Occupants

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | ✅ | ✅ | ✅ | ✅ | Can manage occupants |
| cmc | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_officer | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view occupants. Only privileged users can manage occupants.

---

## Court Operations Tables

### Court Sessions

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| cmc | ✅ | ✅ | ✅ | ✅ | Can manage sessions |
| court_officer | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view court sessions. Court operations managers (admin, cmc) can manage sessions.

---

### Court Rooms

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| cmc | ✅ | ✅ | ✅ | ✅ | Can manage court rooms |
| court_officer | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| court_aide | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| purchasing | 📖 | 🔒 | 🔒 | 🔒 | Read-only |
| standard | 📖 | 🔒 | 🔒 | 🔒 | Read-only |

**Policy:** All users can view court rooms. Court operations managers can manage court rooms.

---

## User Management Tables

### Profiles

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | 📖 | 📝 | 📝 | 🔒 | Can update own profile |
| cmc | 📖 | 📝 | 📝 | 🔒 | Can update own profile |
| court_officer | 📖 | 📝 | 📝 | 🔒 | Can update own profile |
| court_aide | 📖 | 📝 | 📝 | 🔒 | Can update own profile |
| purchasing | 📖 | 📝 | 📝 | 🔒 | Can update own profile |
| standard | 📖 | 📝 | 📝 | 🔒 | Can update own profile |

**Policy:** All users can view all profiles (directory). Users can update their own profile. Admins have full access.

---

### User Roles

| Role | Read | Create | Update | Delete | Notes |
|------|------|--------|--------|--------|-------|
| admin | ✅ | ✅ | ✅ | ✅ | Full access |
| system_admin | ✅ | ✅ | ✅ | ✅ | Full access |
| facilities_manager | 📝 | 🔒 | 🔒 | 🔒 | Can view own role |
| cmc | 📝 | 🔒 | 🔒 | 🔒 | Can view own role |
| court_officer | 📝 | 🔒 | 🔒 | 🔒 | Can view own role |
| court_aide | 📝 | 🔒 | 🔒 | 🔒 | Can view own role |
| purchasing | 📝 | 🔒 | 🔒 | 🔒 | Can view own role |
| standard | 📝 | 🔒 | 🔒 | 🔒 | Can view own role |

**Policy:** Users can view their own role. Admins can view/manage all roles.

---

## Role Groups Summary

### Admin Tier (Full System Access)
- **admin**
- **system_admin**

### Management Tier
- **facilities_manager** - Building/spatial operations
- **cmc** - Court operations

### Operations Tier
- **court_officer** - Building operations, key management
- **court_aide** - Supply operations, issue management

### Limited Tier
- **purchasing** - Read-only (Phase 9 will define write access)
- **standard** - Read-only + own data management

---

## Helper Functions Used

| Function | Roles Included | Purpose |
|----------|---------------|---------|
| `is_admin()` | admin, system_admin | Full system access |
| `is_privileged()` | admin, system_admin, facilities_manager | Spatial catalog management |
| `is_court_operations_manager()` | admin, system_admin, cmc | Court operations |
| `is_supply_staff()` | admin, system_admin, court_aide | Supply operations |
| `is_building_staff()` | admin, system_admin, facilities_manager, court_officer | Building operations |
| `is_key_manager()` | admin, system_admin, facilities_manager, court_officer | Key management |
| `is_issue_manager()` | admin, system_admin, facilities_manager, court_officer, court_aide | Issue management |

---

## Testing Checklist

For each role, verify:

- [ ] **admin** - Can access all tables with full CRUD
- [ ] **system_admin** - Same as admin
- [ ] **facilities_manager** - Can manage spatial catalog, buildings, keys
- [ ] **cmc** - Can manage court operations, view spaces
- [ ] **court_officer** - Can manage buildings, keys, lighting
- [ ] **court_aide** - Can manage supply operations, issues
- [ ] **purchasing** - Read-only access (Phase 9 TBD)
- [ ] **standard** - Read-only + own data management

---

## Next Steps

1. Apply migrations 051 and 052
2. Test each role's access patterns
3. Phase 3: Add lighting table RLS policies
4. Phase 7-8: Fix court_officer and cmc permission issues
5. Phase 9: Define purchasing role workflows
