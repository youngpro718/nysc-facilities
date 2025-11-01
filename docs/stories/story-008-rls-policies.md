# STORY-008: RLS Policies & Security

**Story ID:** STORY-008  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Comprehensive Row Level Security Implementation  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 8  
**Sprint:** Sprint 1, Week 4 (Days 1-3)

---

## 📋 User Story

**As a** security administrator  
**I want** comprehensive RLS policies on all sensitive tables  
**So that** users can only access data they're authorized to see

---

## 🎯 Acceptance Criteria

- [ ] RLS enabled on all sensitive tables
- [ ] Policies created for SELECT, INSERT, UPDATE, DELETE
- [ ] Role-based access control implemented
- [ ] Department-based access implemented
- [ ] RLS testing framework created
- [ ] Security audit completed
- [ ] Performance impact assessed

---

## 🔐 RLS Policy Framework

### Policy Naming Convention
```
Format: <table>_<operation>_<condition>

Examples:
rooms_select_public
rooms_insert_facilities_staff
rooms_update_owner_or_admin
rooms_delete_admin_only
```

### Policy Template
```sql
-- Policy: [POLICY_NAME]
-- Description: [WHAT THIS POLICY DOES]
-- Applies to: [ROLES/CONDITIONS]

CREATE POLICY "[policy_name]" ON [table_name]
  FOR [SELECT|INSERT|UPDATE|DELETE|ALL]
  [USING (condition)]  -- For SELECT, UPDATE, DELETE
  [WITH CHECK (condition)];  -- For INSERT, UPDATE
```

---

## 🗄️ Core Table RLS Policies

### Rooms Table
```sql
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Public read access for active rooms
CREATE POLICY "rooms_select_active" ON rooms
  FOR SELECT
  USING (deleted_at IS NULL);

-- Admins can see all rooms (including deleted)
CREATE POLICY "rooms_select_admin" ON rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager')
    )
  );

-- Facilities staff can insert rooms
CREATE POLICY "rooms_insert_facilities" ON rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager', 'facilities_staff')
    )
  );

-- Facilities staff can update rooms
CREATE POLICY "rooms_update_facilities" ON rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager', 'facilities_staff')
    )
  );

-- Only admins can soft delete
CREATE POLICY "rooms_delete_admin" ON rooms
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' AND
    deleted_at IS NULL
  )
  WITH CHECK (deleted_at IS NOT NULL);
```

### Keys Table
```sql
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active keys
CREATE POLICY "keys_select_active" ON keys
  FOR SELECT
  USING (
    deleted_at IS NULL AND
    auth.uid() IS NOT NULL
  );

-- Security admins can view all keys
CREATE POLICY "keys_select_admin" ON keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- Only security admins can modify keys
CREATE POLICY "keys_modify_admin" ON keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );
```

### Key Assignments Table
```sql
ALTER TABLE key_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "key_assignments_select_own" ON key_assignments
  FOR SELECT
  USING (
    occupant_id IN (
      SELECT id FROM occupants WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- Security admins can create assignments
CREATE POLICY "key_assignments_insert_admin" ON key_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- Security admins can update assignments
CREATE POLICY "key_assignments_update_admin" ON key_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );
```

### Key Requests Table
```sql
ALTER TABLE key_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "key_requests_select_own" ON key_requests
  FOR SELECT
  USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- Authenticated users can create requests
CREATE POLICY "key_requests_insert_authenticated" ON key_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    requester_id = auth.uid()
  );

-- Only admins can update requests (approve/reject)
CREATE POLICY "key_requests_update_admin" ON key_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );
```

### Issues Table
```sql
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Everyone can view non-internal issues
CREATE POLICY "issues_select_public" ON issues
  FOR SELECT
  USING (true);

-- Authenticated users can create issues
CREATE POLICY "issues_insert_authenticated" ON issues
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    reported_by = auth.uid()
  );

-- Users can update their own issues or assigned issues
CREATE POLICY "issues_update_own_or_assigned" ON issues
  FOR UPDATE
  USING (
    reported_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'facilities_staff')
    )
  );

-- Only admins can delete issues
CREATE POLICY "issues_delete_admin" ON issues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );
```

### Court Terms & Assignments
```sql
-- Court Terms
ALTER TABLE court_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "court_terms_select_all" ON court_terms
  FOR SELECT USING (true);

CREATE POLICY "court_terms_modify_court_ops" ON court_terms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'court_operations')
    )
  );

-- Court Assignments
ALTER TABLE court_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "court_assignments_select_all" ON court_assignments
  FOR SELECT USING (true);

CREATE POLICY "court_assignments_modify_court_ops" ON court_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'court_operations')
    )
  );
```

### Profiles & User Roles
```sql
-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager')
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent users from changing sensitive fields
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );

-- User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "user_roles_select_admin" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );

-- Only admins can modify roles
CREATE POLICY "user_roles_modify_admin" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );
```

---

## 🧪 RLS Testing Framework

### Test Helper Functions
```sql
-- Function to test RLS as different users
CREATE OR REPLACE FUNCTION test_rls_as_user(
  p_user_id UUID,
  p_table_name TEXT,
  p_operation TEXT
)
RETURNS TABLE (
  can_access BOOLEAN,
  row_count BIGINT,
  error_message TEXT
) AS $$
DECLARE
  v_query TEXT;
  v_count BIGINT;
BEGIN
  -- Set session to test user
  PERFORM set_config('request.jwt.claim.sub', p_user_id::TEXT, true);
  
  -- Build test query
  v_query := format('SELECT COUNT(*) FROM %I', p_table_name);
  
  BEGIN
    EXECUTE v_query INTO v_count;
    RETURN QUERY SELECT true, v_count, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 0::BIGINT, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Test Cases
```sql
-- Test Suite: RLS Policies
DO $$
DECLARE
  admin_user_id UUID := '00000000-0000-0000-0000-000000000001';
  regular_user_id UUID := '00000000-0000-0000-0000-000000000002';
  test_result RECORD;
BEGIN
  RAISE NOTICE 'Starting RLS Test Suite...';
  
  -- Test 1: Admin can view all rooms
  SELECT * INTO test_result 
  FROM test_rls_as_user(admin_user_id, 'rooms', 'SELECT');
  
  IF test_result.can_access THEN
    RAISE NOTICE 'PASS: Admin can view rooms (% rows)', test_result.row_count;
  ELSE
    RAISE EXCEPTION 'FAIL: Admin cannot view rooms: %', test_result.error_message;
  END IF;
  
  -- Test 2: Regular user can view active rooms
  SELECT * INTO test_result 
  FROM test_rls_as_user(regular_user_id, 'rooms', 'SELECT');
  
  IF test_result.can_access THEN
    RAISE NOTICE 'PASS: Regular user can view rooms (% rows)', test_result.row_count;
  ELSE
    RAISE EXCEPTION 'FAIL: Regular user cannot view rooms: %', test_result.error_message;
  END IF;
  
  -- Test 3: Regular user cannot view audit logs
  SELECT * INTO test_result 
  FROM test_rls_as_user(regular_user_id, 'audit_logs', 'SELECT');
  
  IF NOT test_result.can_access OR test_result.row_count = 0 THEN
    RAISE NOTICE 'PASS: Regular user cannot view audit logs';
  ELSE
    RAISE EXCEPTION 'FAIL: Regular user can view audit logs (% rows)', test_result.row_count;
  END IF;
  
  RAISE NOTICE 'RLS Test Suite Complete!';
END $$;
```

---

## 📊 RLS Performance Impact

### Performance Monitoring
```sql
-- Monitor RLS policy execution time
CREATE OR REPLACE VIEW rls_performance AS
SELECT 
  schemaname,
  tablename,
  policyname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE rowsecurity = true
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to check slow queries with RLS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%WHERE%auth.uid%'
ORDER BY mean_time DESC
LIMIT 20;
```

### Optimization Strategies
1. **Index on user_id columns** for fast policy checks
2. **Materialized views** for complex policy conditions
3. **Function-based policies** for reusable logic
4. **Bypass RLS** for service accounts (with caution)

---

## 🔒 Security Audit Checklist

### Pre-Deployment
- [ ] All sensitive tables have RLS enabled
- [ ] Each table has policies for all operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] No tables allow anonymous access unless intended
- [ ] Admin override policies are properly restricted
- [ ] Audit logs are read-only for non-admins
- [ ] User roles table is properly protected

### Testing
- [ ] Test as admin user
- [ ] Test as regular user
- [ ] Test as anonymous user
- [ ] Test cross-user data access (should fail)
- [ ] Test policy bypass attempts
- [ ] Performance test with RLS enabled

### Documentation
- [ ] All policies documented
- [ ] Access matrix created
- [ ] Security exceptions documented
- [ ] Incident response plan updated

---

## 📚 RLS Policy Documentation

### Access Matrix
| Table | Admin | Manager | Staff | User | Anonymous |
|-------|-------|---------|-------|------|-----------|
| rooms | Full | Full | Read | Read | Read |
| keys | Full | Read | Read | Read | None |
| key_assignments | Full | Full | Read | Own | None |
| key_requests | Full | Full | Read | Own | None |
| issues | Full | Full | Full | Own | Read |
| court_terms | Full | Full | Read | Read | Read |
| court_assignments | Full | Full | Read | Read | Read |
| profiles | Full | Read | Read | Own | None |
| user_roles | Full | None | None | Own | None |
| audit_logs | Full | None | None | None | None |

### Policy Exceptions
- **Service Accounts**: Bypass RLS for background jobs
- **System Functions**: Some RPC functions run with elevated privileges
- **Public Data**: Building/floor information is public

---

## ✅ Definition of Done

- [ ] RLS enabled on all sensitive tables
- [ ] Policies created for all operations
- [ ] Test suite passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Access matrix documented
- [ ] Team trained on RLS
- [ ] Deployed to production

---

**Story Owner:** Security Team  
**Created:** October 25, 2025
