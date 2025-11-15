# STORY-006: Audit Log Framework

**Story ID:** STORY-006  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Implement Comprehensive Audit Logging Framework  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 1, Week 3 (Days 1-2)

---

## 📋 User Story

**As a** system administrator  
**I want** comprehensive audit logging for all critical operations  
**So that** I can track changes, ensure compliance, and investigate issues

---

## 🎯 Acceptance Criteria

- [ ] Audit_logs table created with proper structure
- [ ] Triggers for automatic audit logging
- [ ] Audit log retention policy defined
- [ ] Audit log query functions created
- [ ] RLS policies for audit data
- [ ] Performance optimized for high-volume logging

---

## 🏗️ Proposed Schema

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Details
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation audit_operation_enum NOT NULL,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Actor
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  user_role TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Context
  action_description TEXT,
  action_category audit_category_enum,
  severity audit_severity_enum DEFAULT 'info',
  
  -- Metadata
  session_id TEXT,
  request_id TEXT,
  correlation_id TEXT,
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexing hints
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM created_at)) STORED,
  month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM created_at)) STORED
);

-- Enums
CREATE TYPE audit_operation_enum AS ENUM (
  'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'TRUNCATE'
);

CREATE TYPE audit_category_enum AS ENUM (
  'authentication', 'authorization', 'data_change', 'configuration',
  'security', 'access_control', 'system', 'user_action'
);

CREATE TYPE audit_severity_enum AS ENUM (
  'debug', 'info', 'notice', 'warning', 'error', 'critical'
);

-- Indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_category ON audit_logs(action_category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) 
  WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_logs_year_month ON audit_logs(year, month);

-- Partitioning by month for performance
CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- ... (create partitions for each month)
```

### Audit Trigger Function
```sql
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
  user_info RECORD;
BEGIN
  -- Get user information
  SELECT id, email, role INTO user_info
  FROM profiles
  WHERE id = auth.uid();
  
  -- Prepare old and new data
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Identify changed fields
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    changed_fields,
    user_id,
    user_email,
    user_role,
    action_category
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::audit_operation_enum,
    old_data,
    new_data,
    changed_fields,
    user_info.id,
    user_info.email,
    user_info.role,
    'data_change'::audit_category_enum
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Apply Audit Triggers to Critical Tables
```sql
-- Rooms table
CREATE TRIGGER trg_rooms_audit
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

-- Keys table
CREATE TRIGGER trg_keys_audit
  AFTER INSERT OR UPDATE OR DELETE ON keys
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

-- Key assignments
CREATE TRIGGER trg_key_assignments_audit
  AFTER INSERT OR UPDATE OR DELETE ON key_assignments
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

-- Court assignments
CREATE TRIGGER trg_court_assignments_audit
  AFTER INSERT OR UPDATE OR DELETE ON court_assignments
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

-- Issues
CREATE TRIGGER trg_issues_audit
  AFTER INSERT OR UPDATE OR DELETE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

-- User roles
CREATE TRIGGER trg_user_roles_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();
```

### Audit Query Functions
```sql
-- Get audit trail for a specific record
CREATE OR REPLACE FUNCTION get_audit_trail(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  operation TEXT,
  changed_fields TEXT[],
  old_values JSONB,
  new_values JSONB,
  user_email TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.operation::TEXT,
    a.changed_fields,
    a.old_values,
    a.new_values,
    a.user_email,
    a.created_at
  FROM audit_logs a
  WHERE a.table_name = p_table_name
    AND a.record_id = p_record_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user activity
CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  table_name TEXT,
  operation TEXT,
  record_count BIGINT,
  last_action TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.table_name,
    a.operation::TEXT,
    COUNT(*) as record_count,
    MAX(a.created_at) as last_action
  FROM audit_logs a
  WHERE a.user_id = p_user_id
    AND a.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY a.table_name, a.operation
  ORDER BY last_action DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent critical events
CREATE OR REPLACE FUNCTION get_critical_events(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  operation TEXT,
  severity TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.table_name,
    a.operation::TEXT,
    a.severity::TEXT,
    a.user_email,
    a.created_at
  FROM audit_logs a
  WHERE a.severity IN ('error', 'critical')
    AND a.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔐 Row Level Security

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- No one can modify audit logs (append-only)
CREATE POLICY "audit_logs_no_modify" ON audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE
  USING (false);
```

---

## 📊 Data Retention Policy

```sql
-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
  p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old logs to archive table
  WITH archived AS (
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    RETURNING *
  )
  INSERT INTO audit_logs_archive
  SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create archive table
CREATE TABLE audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- Schedule monthly archival (via pg_cron or external scheduler)
-- SELECT cron.schedule('archive-audit-logs', '0 0 1 * *', 
--   'SELECT archive_old_audit_logs(365)');
```

---

## 🧪 Testing

```sql
-- Test: Audit log creation
UPDATE rooms SET capacity = 50 WHERE id = 'room-uuid';

SELECT * FROM audit_logs 
WHERE table_name = 'rooms' 
  AND record_id = 'room-uuid'
ORDER BY created_at DESC
LIMIT 1;
-- Should show UPDATE operation with old/new values

-- Test: Audit trail function
SELECT * FROM get_audit_trail('rooms', 'room-uuid');
-- Should return all changes to the room

-- Test: User activity
SELECT * FROM get_user_activity(auth.uid());
-- Should show all actions by current user

-- Test: Critical events
SELECT * FROM get_critical_events(24);
-- Should show any critical events in last 24 hours

-- Test: RLS enforcement
SET ROLE regular_user;
SELECT * FROM audit_logs;
-- Should return no rows (only admins can view)
```

---

## 📈 Performance Considerations

### Optimization Strategies
1. **Partitioning** - Monthly partitions for time-based queries
2. **Selective Logging** - Only log critical tables
3. **Async Archival** - Move old logs to archive table
4. **Index Optimization** - Indexes on common query patterns
5. **JSONB Compression** - Compress old_values/new_values

### Monitoring
```sql
-- Monitor audit log size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'audit_logs%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor audit log growth rate
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as log_count,
  pg_size_pretty(SUM(pg_column_size(audit_logs.*))) as size
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
```

---

## 📚 Documentation

### Audit Log Fields
- **table_name** - Table where change occurred
- **record_id** - ID of the affected record
- **operation** - INSERT, UPDATE, DELETE
- **old_values** - Previous values (UPDATE/DELETE)
- **new_values** - New values (INSERT/UPDATE)
- **changed_fields** - List of modified fields
- **user_id** - User who made the change
- **created_at** - When the change occurred

### Compliance Requirements
- **Retention:** 1 year minimum, 7 years for financial records
- **Access:** Admin-only, read-only
- **Integrity:** Append-only, no modifications
- **Completeness:** All critical operations logged

---

## ✅ Definition of Done

- [ ] Audit_logs table created
- [ ] Partitioning implemented
- [ ] Audit triggers applied to critical tables
- [ ] Query functions created and tested
- [ ] RLS policies applied
- [ ] Retention policy implemented
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Deployed to production

---

**Story Owner:** Backend Developer  
**Created:** October 25, 2025
