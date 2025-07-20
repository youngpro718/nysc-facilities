# NYSC Facilities Database Stabilization Plan

## Phase 1: Stabilize & Document

### Current State Assessment (January 20, 2025)

#### Database Complexity
- **124+ tables** with complex relationships
- **150+ migration files** (created over time)
- **Individual RLS policies** on most tables
- **Multiple notification systems** with overlapping functionality
- **Complex spaces model** (rooms, hallways, doors, new_spaces view)

#### Critical Security Issues (From Linter)
1. **ERROR**: Security Definer Views detected
2. **WARN**: Function search paths not set (security risk)
3. **WARN**: Leaked password protection disabled

#### Admin Dashboard Dependencies (CRITICAL - DO NOT BREAK)
```typescript
// Core admin dashboard data flow:
AdminDashboard → useDashboardData → {
  useBuildingData → buildings, activities
  useAdminIssues → allIssues
  useUserData → profile, userData
  useAuth → isAdmin, permissions
}

// Critical tables for admin dashboard:
- buildings (with floors relationship)
- rooms (with lighting_fixtures)
- issues (all issues for admin view)
- building_activities (recent activities)
- profiles/user_roles (for authentication)
```

### Immediate Stabilization Tasks

#### 1. Create Comprehensive Backup
```sql
-- Full database backup with structure and data
pg_dump --create --clean --if-exists --format=custom \
  --file=nysc_facilities_backup_$(date +%Y%m%d_%H%M%S).backup

-- Schema-only backup for structure analysis
pg_dump --schema-only --create --clean --if-exists \
  --file=nysc_facilities_schema_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Fix Critical Security Issues
```sql
-- Fix security definer views
-- Fix function search paths
-- Enable leaked password protection
```

#### 3. Document Critical Dependencies

##### Admin Dashboard Query Patterns
```sql
-- Buildings with floors and rooms (used by useBuildingData)
SELECT b.*, f.*, r.*, lf.*
FROM buildings b
LEFT JOIN floors f ON b.id = f.building_id
LEFT JOIN rooms r ON f.id = r.floor_id
LEFT JOIN lighting_fixtures lf ON r.id = lf.room_id
WHERE b.status = 'active'

-- All issues for admin view (used by useAdminIssues)
SELECT * FROM issues ORDER BY created_at DESC

-- Building activities (used by useBuildingData)
SELECT * FROM building_activities 
ORDER BY created_at DESC LIMIT 10
```

#### 4. Create Rollback Procedures
- Document current admin dashboard functionality
- Create test scripts to verify admin operations
- Prepare rapid rollback for any failed changes

### Safe Improvement Targets (Phase 1)

#### A. Performance Optimizations (NO UI IMPACT)
```sql
-- Add missing indexes for admin dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buildings_status ON buildings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_floors_building_id ON floors(building_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lighting_fixtures_room_id ON lighting_fixtures(room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_activities_created_at ON building_activities(created_at DESC);
```

#### B. Documentation Improvements
- Create schema diagrams
- Document admin dashboard data flow
- Map table relationships
- Document RLS policy patterns

#### C. Code Organization (NON-ADMIN COMPONENTS ONLY)
- Consolidate non-admin hooks
- Organize user-facing components
- Clean up unused imports

### Testing Protocol

#### Before Any Changes
1. **Admin Dashboard Functionality Test**
   - Login as admin user
   - Verify buildings grid loads
   - Check issues display correctly
   - Verify activities show up
   - Test refresh functionality

2. **Data Integrity Verification**
   - Run queries that admin dashboard uses
   - Verify row counts match expectations
   - Check for broken relationships

3. **Performance Baseline**
   - Time admin dashboard load
   - Measure query execution times
   - Monitor memory usage

#### After Each Change
1. Re-run all functionality tests
2. Compare performance metrics
3. Verify no data loss
4. Check error logs

### Risk Mitigation

#### Red Lines (NEVER CROSS)
- Never drop tables without confirmed replacement
- Never change admin dashboard queries without testing
- Never modify RLS policies without full testing
- Never change primary keys or foreign key relationships

#### Yellow Lines (EXTREME CAUTION)
- Consolidating tables (must maintain views for compatibility)
- Changing column names (must have migration path)
- Modifying notification systems (admin uses these)

#### Green Lines (SAFE TO PROCEED)
- Adding indexes
- Optimizing queries
- Cleaning up unused code
- Improving documentation
- Organizing non-admin components

### Success Metrics

#### Phase 1 Success Criteria
- [ ] Admin dashboard works identically
- [ ] All critical security issues resolved
- [ ] Performance improved or maintained
- [ ] Complete backup and rollback procedures
- [ ] Comprehensive documentation created
- [ ] No data loss or corruption

#### Ready for Phase 2 When...
- All Phase 1 criteria met
- Admin team confirms dashboard works perfectly
- Full test suite passes
- Rollback procedures verified
- Team comfortable with changes

### Monitoring and Alerts

#### Daily Monitoring
- Admin dashboard load times
- Error rates in admin functions
- Database query performance
- User authentication success rates

#### Weekly Reviews
- System stability metrics
- User feedback on admin features
- Performance trend analysis
- Security audit results

---

**CRITICAL REMINDER**: The admin dashboard is the heart of this system. Any change that breaks it is unacceptable. When in doubt, don't change it.