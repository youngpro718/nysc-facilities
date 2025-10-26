# STORY-007: Migration Framework & Scripts

**Story ID:** STORY-007  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Establish Migration Framework and Consolidate Scripts  
**Status:** 📋 To Do  
**Priority:** 🟡 High  
**Story Points:** 3  
**Sprint:** Sprint 1, Week 3 (Days 3-4)

---

## 📋 User Story

**As a** database administrator  
**I want** a standardized migration framework  
**So that** schema changes are versioned, tested, and safely deployed

---

## 🎯 Acceptance Criteria

- [ ] Migration naming convention established
- [ ] Migration template created
- [ ] Existing migrations organized and documented
- [ ] Rollback procedures documented
- [ ] Seed data scripts created
- [ ] Migration testing checklist created

---

## 🗄️ Current State

### Existing Migrations
- **Location:** `/supabase/migrations/`
- **Count:** 40+ migration files
- **Issues:** 
  - Inconsistent naming
  - Some migrations lack rollback scripts
  - No clear documentation
  - Seed data mixed with schema changes

---

## 🏗️ Proposed Structure

### Migration Naming Convention
```
Format: YYYYMMDD_HHMMSS_descriptive_name.sql

Examples:
20250101_000000_initial_schema.sql
20250102_120000_add_rooms_table.sql
20250103_143000_add_audit_triggers.sql
20250104_091500_seed_initial_data.sql
```

### Migration Template
```sql
-- Migration: [MIGRATION_NAME]
-- Description: [WHAT THIS MIGRATION DOES]
-- Author: [AUTHOR_NAME]
-- Date: [DATE]
-- Epic: EPIC-001
-- Story: STORY-XXX

-- ============================================
-- MIGRATION UP
-- ============================================

BEGIN;

-- Step 1: [Description]
-- [SQL statements]

-- Step 2: [Description]
-- [SQL statements]

-- Verification
DO $$
BEGIN
  -- Verify migration success
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'new_table') THEN
    RAISE EXCEPTION 'Migration failed: new_table not created';
  END IF;
END $$;

COMMIT;

-- ============================================
-- MIGRATION DOWN (Rollback)
-- ============================================

-- Uncomment to rollback:
/*
BEGIN;

-- Reverse Step 2
-- [Rollback SQL]

-- Reverse Step 1
-- [Rollback SQL]

COMMIT;
*/

-- ============================================
-- NOTES
-- ============================================
-- Dependencies: [List any dependent migrations]
-- Breaking Changes: [Yes/No - describe if yes]
-- Data Migration: [Yes/No - describe if yes]
-- Estimated Duration: [Time estimate]
```

### Directory Structure
```
supabase/
├── migrations/
│   ├── 00_initial/
│   │   └── 20250101_000000_initial_schema.sql
│   ├── 01_core_tables/
│   │   ├── 20250102_000000_rooms_table.sql
│   │   ├── 20250103_000000_schedules_table.sql
│   │   ├── 20250104_000000_capacities_table.sql
│   │   ├── 20250105_000000_keys_tables.sql
│   │   └── 20250106_000000_tickets_table.sql
│   ├── 02_infrastructure/
│   │   ├── 20250107_000000_audit_log.sql
│   │   └── 20250108_000000_rls_policies.sql
│   ├── 03_enhancements/
│   │   └── [Future migrations]
│   └── README.md
├── seed/
│   ├── 01_reference_data.sql
│   ├── 02_test_users.sql
│   ├── 03_sample_rooms.sql
│   └── README.md
└── rollback/
    ├── rollback_template.sql
    └── emergency_rollback.sql
```

---

## 📊 Migration Consolidation Plan

### Phase 1: Audit Existing Migrations
```sql
-- Script to analyze existing migrations
SELECT 
  filename,
  size,
  modified_date,
  CASE 
    WHEN filename ~ '^[0-9]{8}' THEN 'Properly named'
    ELSE 'Needs renaming'
  END as naming_status
FROM pg_ls_dir('supabase/migrations') files(filename)
ORDER BY filename;
```

### Phase 2: Consolidate Related Migrations
```sql
-- Example: Consolidate multiple key-related migrations
-- INTO: 20250105_000000_keys_tables_complete.sql

-- Old migrations to consolidate:
-- - 20250713_keys_table.sql
-- - 20250714_key_assignments.sql
-- - 20250715_key_requests.sql
-- - 20250716_key_orders.sql
-- - 20250717_key_audit.sql

-- New consolidated migration includes all key tables
```

### Phase 3: Create Rollback Scripts
```sql
-- For each migration, create corresponding rollback
-- Example: 20250105_000000_keys_tables_complete_rollback.sql

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_keys_audit ON keys;
DROP TRIGGER IF EXISTS trg_key_assignments_audit ON key_assignments;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS key_audit_logs CASCADE;
DROP TABLE IF EXISTS key_orders CASCADE;
DROP TABLE IF EXISTS key_requests CASCADE;
DROP TABLE IF EXISTS key_assignments CASCADE;
DROP TABLE IF EXISTS keys CASCADE;

-- Drop enums
DROP TYPE IF EXISTS key_type_enum CASCADE;
DROP TYPE IF EXISTS access_level_enum CASCADE;
-- ... (all other enums)

COMMIT;
```

---

## 🧪 Migration Testing Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Test migration in staging environment
- [ ] Verify rollback script works
- [ ] Check for breaking changes
- [ ] Estimate migration duration
- [ ] Schedule maintenance window if needed

### During Migration
- [ ] Monitor migration progress
- [ ] Check for errors in logs
- [ ] Verify data integrity
- [ ] Test application functionality
- [ ] Monitor performance metrics

### Post-Migration
- [ ] Verify all tables created
- [ ] Verify all indexes created
- [ ] Verify all triggers active
- [ ] Run smoke tests
- [ ] Check application logs
- [ ] Monitor for 24 hours

---

## 📝 Seed Data Scripts

### Reference Data
```sql
-- seed/01_reference_data.sql
-- Insert reference data that doesn't change

BEGIN;

-- Building types
INSERT INTO building_types (name, description) VALUES
  ('Courthouse', 'Main courthouse building'),
  ('Annex', 'Courthouse annex building'),
  ('Administrative', 'Administrative offices');

-- Room types (if not using enum)
INSERT INTO room_types (name, description, default_capacity) VALUES
  ('Courtroom', 'Court proceedings room', 100),
  ('Office', 'Individual office', 4),
  ('Conference', 'Conference room', 20);

COMMIT;
```

### Test Users
```sql
-- seed/02_test_users.sql
-- Create test users for development

BEGIN;

-- Admin user
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@test.com', 'Admin', 'User', 'administrator');

-- Regular user
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'user@test.com', 'Regular', 'User', 'staff');

-- Assign roles
INSERT INTO user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'administrator'),
  ('00000000-0000-0000-0000-000000000002', 'staff');

COMMIT;
```

### Sample Data
```sql
-- seed/03_sample_rooms.sql
-- Create sample rooms for testing

BEGIN;

-- Sample building
INSERT INTO buildings (id, name, address) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Main Courthouse', '100 Centre St');

-- Sample floor
INSERT INTO floors (id, building_id, floor_number, name) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'First Floor');

-- Sample rooms
INSERT INTO rooms (building_id, floor_id, room_number, room_type, capacity) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '101', 'office', 4),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '102', 'office', 4),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '103', 'conference', 20);

COMMIT;
```

---

## 🔧 Migration Helper Functions

### Check Migration Status
```sql
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS TABLE (
  migration_name TEXT,
  applied BOOLEAN,
  applied_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    name as migration_name,
    true as applied,
    executed_at as applied_at
  FROM supabase_migrations.schema_migrations
  ORDER BY executed_at DESC;
END;
$$ LANGUAGE plpgsql;
```

### Verify Schema Integrity
```sql
CREATE OR REPLACE FUNCTION verify_schema_integrity()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check for missing foreign keys
  RETURN QUERY
  SELECT 
    'Foreign Keys' as check_name,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END as status,
    COUNT(*)::TEXT || ' foreign keys found' as details
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY';
  
  -- Check for missing indexes
  RETURN QUERY
  SELECT 
    'Indexes' as check_name,
    CASE WHEN COUNT(*) > 50 THEN 'OK' ELSE 'WARNING' END as status,
    COUNT(*)::TEXT || ' indexes found' as details
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  -- Check for RLS enabled
  RETURN QUERY
  SELECT 
    'RLS Enabled' as check_name,
    CASE WHEN COUNT(*) > 10 THEN 'OK' ELSE 'WARNING' END as status,
    COUNT(*)::TEXT || ' tables with RLS' as details
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
END;
$$ LANGUAGE plpgsql;
```

---

## 📚 Documentation

### Migration README
```markdown
# Database Migrations

## Running Migrations

### Development
```bash
supabase db reset  # Reset and run all migrations
supabase db push   # Push local changes to remote
```

### Production
```bash
supabase db push --linked  # Push to linked project
```

## Creating New Migrations

1. Use the template in `migration_template.sql`
2. Name using format: `YYYYMMDD_HHMMSS_description.sql`
3. Include rollback script
4. Test in staging first
5. Document breaking changes

## Rollback Procedure

1. Stop application
2. Run rollback script
3. Verify data integrity
4. Restart application
5. Monitor for issues
```

---

## ✅ Definition of Done

- [ ] Migration naming convention documented
- [ ] Migration template created
- [ ] Existing migrations organized
- [ ] Rollback scripts created
- [ ] Seed data scripts created
- [ ] Helper functions implemented
- [ ] Documentation complete
- [ ] Team trained on process

---

**Story Owner:** Database Admin  
**Created:** October 25, 2025
