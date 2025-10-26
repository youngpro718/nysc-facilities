# Epic 001: Schema Stabilization

**Epic ID:** EPIC-001  
**Title:** Database Schema Stabilization & Migration Framework  
**Status:** 📋 Planning  
**Priority:** 🔴 Critical  
**Target:** Sprint 1-2 (4 weeks)  
**Owner:** Backend Team  
**Created:** October 25, 2025

---

## 📋 Executive Summary

Stabilize the NYSC Facilities database schema to provide a solid foundation for court operations. This epic focuses on defining, documenting, and migrating core tables (rooms, schedules, capacities, keys, tickets, audit logs) with proper relationships, constraints, and Row Level Security (RLS) policies.

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Stable Schema Foundation** - Define and document all core tables with proper relationships
2. **Migration Framework** - Establish versioned migration system for schema changes
3. **Data Integrity** - Implement constraints, indexes, and validation rules
4. **Security Baseline** - Apply RLS policies to all sensitive tables
5. **Audit Trail** - Comprehensive logging for all critical operations

### Success Criteria
- ✅ All core tables documented with ERD diagrams
- ✅ Migration scripts tested and version-controlled
- ✅ RLS policies applied and tested for all tables
- ✅ Seed data scripts for development/testing
- ✅ Zero breaking changes to existing functionality
- ✅ Performance benchmarks established

---

## 🗄️ Current State Analysis

### Existing Database Structure
Based on brownfield analysis, the current database includes:

#### **Core Tables (Existing)**
- `buildings` (2 records) - Building information
- `floors` (15 records) - Floor layout
- `rooms` (94 records) - Room inventory
- `court_rooms` (32 records) - Courtroom-specific data
- `issues` (2 active) - Facility issues
- `keys` (8 keys) - Key inventory
- `key_assignments` (11 active) - Key distribution
- `key_requests` (6 requests) - Key request workflow
- `profiles` - User profiles
- `personnel_profiles` (150+ records) - Court personnel
- `occupants` - Room occupancy

#### **Supporting Tables**
- `maintenance_schedule` - Scheduled maintenance
- `court_assignments` - Court term assignments
- `court_terms` - Court scheduling
- `inventory_items` - Supply inventory
- `supply_requests` - Supply request workflow

#### **Views & Functions**
- `unified_spaces` - Combined spatial view
- `key_inventory_view` - Aggregated key data
- `personnel_profiles_view` - Personnel aggregation
- `get_dashboard_stats()` - Dashboard RPC
- `create_key_order()` - Key ordering RPC

### Identified Issues
1. **Schema Documentation** - Limited ERD and relationship documentation
2. **Migration Management** - 40+ migration files need organization
3. **Constraint Gaps** - Some foreign keys and checks missing
4. **RLS Coverage** - Some tables lack proper RLS policies
5. **Audit Logging** - Inconsistent audit trail implementation
6. **Performance** - Missing indexes on frequently queried columns

---

## 📊 Scope & Stories

This epic is broken down into **8 user stories** covering:

### **Core Schema Stories**
1. **[STORY-001](../stories/story-001-rooms-table.md)** - Rooms Table Stabilization
2. **[STORY-002](../stories/story-002-schedules-table.md)** - Schedules & Court Terms Table
3. **[STORY-003](../stories/story-003-capacities-table.md)** - Room Capacities & Occupancy
4. **[STORY-004](../stories/story-004-keys-table.md)** - Keys & Access Management Tables
5. **[STORY-005](../stories/story-005-tickets-table.md)** - Issues & Tickets System

### **Infrastructure Stories**
6. **[STORY-006](../stories/story-006-audit-log.md)** - Audit Log Framework
7. **[STORY-007](../stories/story-007-migrations.md)** - Migration Framework & Scripts
8. **[STORY-008](../stories/story-008-rls-policies.md)** - RLS Policies & Security

---

## 🏗️ Technical Architecture

### Database Design Principles
1. **Normalization** - 3NF for core tables, denormalization for performance where needed
2. **Referential Integrity** - All foreign keys with proper CASCADE/RESTRICT rules
3. **Audit Trail** - created_at, updated_at, created_by, updated_by on all tables
4. **Soft Deletes** - deleted_at column for recoverable deletions
5. **Versioning** - version column for optimistic locking where needed

### Naming Conventions
- **Tables:** `snake_case`, plural (e.g., `rooms`, `key_assignments`)
- **Columns:** `snake_case` (e.g., `room_number`, `created_at`)
- **Indexes:** `idx_<table>_<column>` (e.g., `idx_rooms_building_id`)
- **Foreign Keys:** `fk_<table>_<ref_table>` (e.g., `fk_rooms_buildings`)
- **Constraints:** `chk_<table>_<condition>` (e.g., `chk_rooms_capacity_positive`)

### Migration Strategy
```
supabase/migrations/
├── 20250101_initial_schema.sql
├── 20250102_rooms_table.sql
├── 20250103_schedules_table.sql
├── 20250104_capacities_table.sql
├── 20250105_keys_tables.sql
├── 20250106_tickets_table.sql
├── 20250107_audit_log.sql
└── 20250108_rls_policies.sql
```

---

## 🔐 Security Requirements

### Row Level Security (RLS)
All tables must have RLS policies for:
- **SELECT** - Users see only their data or public data
- **INSERT** - Proper authorization checks
- **UPDATE** - Owner or admin only
- **DELETE** - Admin only (soft delete preferred)

### Audit Requirements
Critical tables require audit logging:
- `rooms` - Track all changes to room configuration
- `key_assignments` - Track key distribution
- `court_assignments` - Track court scheduling changes
- `issues` - Track issue lifecycle
- User actions on sensitive data

---

## 📈 Performance Considerations

### Indexing Strategy
1. **Primary Keys** - Clustered indexes on id columns
2. **Foreign Keys** - Indexes on all FK columns
3. **Query Patterns** - Indexes based on common WHERE clauses
4. **Composite Indexes** - For multi-column queries
5. **Partial Indexes** - For filtered queries (e.g., active records)

### Optimization Targets
- Query response time: < 100ms for simple queries
- Dashboard load time: < 500ms
- Report generation: < 2 seconds
- Concurrent users: Support 50+ simultaneous users

---

## 🧪 Testing Strategy

### Unit Tests
- Schema validation tests
- Constraint enforcement tests
- RLS policy tests
- Migration rollback tests

### Integration Tests
- Cross-table relationship tests
- Cascade delete tests
- Audit log generation tests
- Performance benchmarks

### Data Quality Tests
- Referential integrity checks
- Data type validation
- Constraint violation checks
- Duplicate detection

---

## 📅 Timeline & Milestones

### Week 1: Core Tables
- **Days 1-2:** Rooms table stabilization (STORY-001)
- **Days 3-4:** Schedules table (STORY-002)
- **Day 5:** Capacities table (STORY-003)

### Week 2: Access & Issues
- **Days 1-2:** Keys tables (STORY-004)
- **Days 3-4:** Tickets/Issues table (STORY-005)
- **Day 5:** Testing & validation

### Week 3: Infrastructure
- **Days 1-2:** Audit log framework (STORY-006)
- **Days 3-4:** Migration framework (STORY-007)
- **Day 5:** Documentation

### Week 4: Security & Polish
- **Days 1-3:** RLS policies (STORY-008)
- **Days 4-5:** Final testing, documentation, deployment

---

## 📊 Dependencies

### Upstream Dependencies
- Supabase project access
- Database admin credentials
- Existing data backup

### Downstream Dependencies
- Frontend components (minimal breaking changes)
- API endpoints (backward compatible)
- Reporting system (may need updates)

### Blockers
- None identified (existing schema is functional)

---

## 🎯 Acceptance Criteria

### Epic Complete When:
- [ ] All 8 stories completed and merged
- [ ] Schema documentation published
- [ ] ERD diagrams created and reviewed
- [ ] All migrations tested in staging
- [ ] RLS policies verified
- [ ] Performance benchmarks met
- [ ] Audit logging functional
- [ ] Seed scripts working
- [ ] Team training completed
- [ ] Production deployment successful

---

## 📚 Documentation Deliverables

1. **ERD Diagrams** - Visual schema representation
2. **Table Documentation** - Column definitions, constraints, relationships
3. **Migration Guide** - How to create and apply migrations
4. **RLS Policy Guide** - Security policy documentation
5. **Seed Data Guide** - Development data setup
6. **Performance Benchmarks** - Query performance baselines
7. **API Impact Analysis** - Breaking changes (if any)
8. **Rollback Procedures** - Emergency rollback steps

---

## 🚨 Risks & Mitigation

### Risk 1: Data Loss During Migration
- **Probability:** Low
- **Impact:** Critical
- **Mitigation:** 
  - Full database backup before migration
  - Test migrations in staging first
  - Rollback scripts prepared
  - Incremental migration approach

### Risk 2: Breaking Changes to Frontend
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Backward compatibility maintained
  - Deprecation warnings for old patterns
  - Frontend team coordination
  - Staged rollout

### Risk 3: Performance Degradation
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Performance testing before deployment
  - Index optimization
  - Query plan analysis
  - Monitoring and alerts

### Risk 4: RLS Policy Gaps
- **Probability:** Medium
- **Impact:** Critical
- **Mitigation:**
  - Security review of all policies
  - Penetration testing
  - Audit log verification
  - Regular security audits

---

## 📞 Stakeholders

### Primary Stakeholders
- **Product Owner:** Court Operations Manager
- **Technical Lead:** Backend Team Lead
- **Database Admin:** DBA Team
- **Security Lead:** Security Team

### Secondary Stakeholders
- Frontend Development Team
- QA Team
- DevOps Team
- End Users (Court Staff)

---

## 🔄 Related Epics

- **EPIC-002:** UI Component Stabilization (depends on this)
- **EPIC-003:** Operations Workflow Enhancement (depends on this)
- **EPIC-004:** Reporting & Analytics (depends on this)

---

## 📝 Notes

### Technical Decisions
- Using Supabase migrations (not custom migration tool)
- PostgreSQL 15+ features available
- RLS preferred over application-level security
- Soft deletes for audit trail preservation
- UTC timestamps for all datetime fields

### Open Questions
- [ ] Retention policy for audit logs?
- [ ] Backup frequency and retention?
- [ ] Performance monitoring tools?
- [ ] Schema change approval process?

---

## 📊 Story Points Summary

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| STORY-001 | Rooms Table | 5 | 📋 To Do |
| STORY-002 | Schedules Table | 5 | 📋 To Do |
| STORY-003 | Capacities Table | 3 | 📋 To Do |
| STORY-004 | Keys Tables | 8 | 📋 To Do |
| STORY-005 | Tickets Table | 5 | 📋 To Do |
| STORY-006 | Audit Log | 5 | 📋 To Do |
| STORY-007 | Migrations | 3 | 📋 To Do |
| STORY-008 | RLS Policies | 8 | 📋 To Do |
| **Total** | | **42** | |

---

## 🎉 Success Metrics

### Quantitative Metrics
- **Schema Stability:** 0 breaking changes after deployment
- **Query Performance:** 95% of queries < 100ms
- **RLS Coverage:** 100% of sensitive tables protected
- **Audit Coverage:** 100% of critical operations logged
- **Migration Success:** 100% successful in staging

### Qualitative Metrics
- Team confidence in schema stability
- Reduced time for new feature development
- Improved data integrity
- Enhanced security posture
- Better developer experience

---

**Epic Owner:** Backend Team Lead  
**Last Updated:** October 25, 2025  
**Next Review:** November 1, 2025
