# Database Migrations - NYSC Facilities

This directory contains the final, production-ready database schema for the NYSC Facilities Management System.

## 📁 Directory Structure

```
db/
├── migrations/          # Sequential migration files
│   ├── 001_core_schema.sql
│   ├── 002_spatial_hierarchy.sql
│   ├── 003_personnel.sql
│   ├── 004_keys_system.sql
│   ├── 005_issues_system.sql
│   ├── 006_court_operations.sql
│   ├── 007_audit_framework.sql
│   ├── 008_rls_policies.sql
│   ├── 009_functions.sql
│   └── 010_views.sql
├── seeds/              # Seed data for development
├── functions/          # Database functions
├── views/              # Database views
└── README.md           # This file
```

## 🚀 Running Migrations

### Using Supabase CLI

```bash
# Run all migrations
supabase db reset

# Run specific migration
psql $DATABASE_URL < db/migrations/001_core_schema.sql
```

### Using psql directly

```bash
# Connect to database
psql $DATABASE_URL

# Run migrations in order
\i db/migrations/001_core_schema.sql
\i db/migrations/002_spatial_hierarchy.sql
# ... continue with remaining migrations
```

## 📋 Migration Order

**IMPORTANT:** Migrations must be run in numerical order due to dependencies.

1. **001_core_schema.sql** - Enums and base types (no dependencies)
2. **002_spatial_hierarchy.sql** - Buildings, floors, rooms (depends on 001)
3. **003_personnel.sql** - Profiles, occupants, roles (depends on 001, 002)
4. **004_keys_system.sql** - Keys and assignments (depends on 002, 003)
5. **005_issues_system.sql** - Issues and tickets (depends on 002, 003)
6. **006_court_operations.sql** - Court terms and assignments (depends on 002, 003)
7. **007_audit_framework.sql** - Audit logs (depends on 003)
8. **008_rls_policies.sql** - Row Level Security (depends on all previous)
9. **009_functions.sql** - Database functions (depends on all previous)
10. **010_views.sql** - Database views (depends on all previous)

## 🗄️ Schema Overview

### Core Tables

**Spatial Hierarchy:**
- `buildings` - Building information
- `floors` - Floor layout
- `rooms` - Room inventory (94 rooms)

**Personnel:**
- `profiles` - User profiles
- `user_roles` - Role assignments
- `occupants` - Room occupants (150+ personnel)

**Keys & Access:**
- `keys` - Key inventory (8 keys)
- `key_assignments` - Key distribution (11 active)
- `key_requests` - Request workflow (6 requests)
- `key_orders` - Procurement (5 orders)

**Issues:**
- `issues` - Facility issues (2 active)
- `issue_comments` - Issue discussions
- `issue_history` - Change tracking

**Court Operations:**
- `court_terms` - Court scheduling
- `court_assignments` - Personnel assignments (32 courtrooms)

**Audit:**
- `audit_logs` - Comprehensive audit trail (partitioned by month)

### Enums

All enums are defined in `001_core_schema.sql`:
- Room types, statuses, operational statuses
- User roles, verification statuses, employment statuses
- Key types, access levels, statuses, assignment types
- Issue categories, types, priorities, severities, statuses
- Court term statuses
- Audit operations, categories, severities

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies defined in `008_rls_policies.sql`:

- **Public Read:** Active records visible to authenticated users
- **Admin Full Access:** Administrators can perform all operations
- **Owner Access:** Users can modify their own records
- **Role-Based Access:** Specific roles have specific permissions
- **Audit Protection:** Audit logs are read-only for non-admins

### Authentication

Uses Supabase Auth with:
- Email/password authentication
- JWT tokens
- Role-based authorization
- Session management

## 📊 Indexes

Strategic indexes are created for:
- All foreign keys
- Common query patterns
- Full-text search (rooms, issues)
- Partial indexes for active records
- Composite indexes for multi-column queries

## 🧪 Testing

After running migrations, verify with:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check enums
SELECT typname 
FROM pg_type 
WHERE typtype = 'e'
ORDER BY typname;
```

## 📈 Performance

### Query Performance Targets
- Simple queries: < 100ms
- Dashboard queries: < 500ms
- Report generation: < 2 seconds
- Concurrent users: 50+

### Optimization Features
- Partitioned audit logs (by month)
- Materialized views for analytics
- Strategic indexes on all foreign keys
- Full-text search indexes
- Partial indexes for active records

## 🔄 Rollback

Each migration includes rollback instructions in comments. To rollback:

```sql
-- Example rollback for 002_spatial_hierarchy.sql
BEGIN;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
COMMIT;
```

## 📚 Documentation

- **Epic:** `/docs/epics/epic-001-schema-stabilization.md`
- **Stories:** `/docs/stories/story-001-*.md` through `story-008-*.md`
- **Architecture:** See Epic document for complete schema diagrams

## 🎯 Related Files

- **Brownfield Analysis:** `/docs/BROWNFIELD_ANALYSIS.md`
- **Quick Reference:** `/docs/QUICK_REFERENCE.md`
- **Architecture Diagrams:** `/docs/ARCHITECTURE_DIAGRAM.md`

## ⚠️ Important Notes

1. **Backup First:** Always backup production database before running migrations
2. **Test in Staging:** Run migrations in staging environment first
3. **Sequential Order:** Migrations must be run in numerical order
4. **No Rollback in Production:** Plan migrations carefully to avoid rollbacks
5. **Monitor Performance:** Watch query performance after migrations

## 📞 Support

For questions or issues:
- Review Epic 001 documentation
- Check story documents for specific tables
- Consult brownfield analysis for current state

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
