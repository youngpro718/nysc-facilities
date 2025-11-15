-- Migration: 001_core_schema.sql
-- Description: Core database schema with enums and base types
-- Author: Architecture Team
-- Date: 2025-10-25
-- Epic: EPIC-001
-- Story: Foundation

-- ============================================
-- MIGRATION UP
-- ============================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================
-- ENUMS
-- ============================================

-- Room enums
CREATE TYPE room_type_enum AS ENUM (
  'office',
  'courtroom',
  'conference',
  'storage',
  'restroom',
  'lobby',
  'hallway',
  'utility',
  'mechanical',
  'other'
);

CREATE TYPE room_status_enum AS ENUM (
  'available',
  'occupied',
  'reserved',
  'maintenance',
  'closed',
  'under_construction'
);

CREATE TYPE operational_status_enum AS ENUM (
  'operational',
  'non_operational',
  'limited',
  'temporary'
);

-- User enums
CREATE TYPE user_role_enum AS ENUM (
  'administrator',
  'manager',
  'staff',
  'user',
  'guest',
  'supply_room_staff',
  'court_operations',
  'facilities_staff',
  'security_admin'
);

CREATE TYPE verification_status_enum AS ENUM (
  'pending',
  'verified',
  'rejected',
  'suspended'
);

CREATE TYPE employment_status_enum AS ENUM (
  'active',
  'inactive',
  'terminated',
  'on_leave',
  'retired'
);

-- Key enums
CREATE TYPE key_type_enum AS ENUM (
  'physical',
  'electronic',
  'card',
  'fob',
  'code'
);

CREATE TYPE access_level_enum AS ENUM (
  'room',
  'floor',
  'building',
  'master',
  'grand_master'
);

CREATE TYPE key_status_enum AS ENUM (
  'active',
  'inactive',
  'lost',
  'damaged',
  'retired'
);

CREATE TYPE assignment_type_enum AS ENUM (
  'permanent',
  'temporary',
  'emergency',
  'loaner'
);

CREATE TYPE assignment_status_enum AS ENUM (
  'assigned',
  'active',
  'returned',
  'lost',
  'overdue',
  'cancelled'
);

CREATE TYPE condition_enum AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor',
  'damaged',
  'lost'
);

CREATE TYPE request_type_enum AS ENUM (
  'new',
  'replacement',
  'additional',
  'temporary'
);

CREATE TYPE urgency_enum AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TYPE request_status_enum AS ENUM (
  'pending',
  'approved',
  'rejected',
  'fulfilled',
  'cancelled'
);

-- Issue enums
CREATE TYPE issue_category_enum AS ENUM (
  'maintenance',
  'repair',
  'cleaning',
  'hvac',
  'electrical',
  'plumbing',
  'security',
  'safety',
  'accessibility',
  'other'
);

CREATE TYPE issue_type_enum AS ENUM (
  'maintenance',
  'repair',
  'inspection',
  'complaint',
  'request',
  'emergency'
);

CREATE TYPE priority_enum AS ENUM (
  'low',
  'medium',
  'high',
  'urgent',
  'critical'
);

CREATE TYPE severity_enum AS ENUM (
  'minor',
  'moderate',
  'major',
  'critical'
);

CREATE TYPE issue_status_enum AS ENUM (
  'open',
  'acknowledged',
  'assigned',
  'in_progress',
  'on_hold',
  'resolved',
  'closed',
  'cancelled'
);

CREATE TYPE resolution_type_enum AS ENUM (
  'fixed',
  'workaround',
  'duplicate',
  'cannot_reproduce',
  'wont_fix',
  'deferred',
  'external'
);

-- Court enums
CREATE TYPE term_status_enum AS ENUM (
  'draft',
  'scheduled',
  'active',
  'completed',
  'cancelled',
  'archived'
);

-- Audit enums
CREATE TYPE audit_operation_enum AS ENUM (
  'INSERT',
  'UPDATE',
  'DELETE',
  'SELECT',
  'TRUNCATE'
);

CREATE TYPE audit_category_enum AS ENUM (
  'authentication',
  'authorization',
  'data_change',
  'configuration',
  'security',
  'access_control',
  'system',
  'user_action'
);

CREATE TYPE audit_severity_enum AS ENUM (
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical'
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate issue numbers
CREATE OR REPLACE FUNCTION generate_issue_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM issues
  WHERE issue_number LIKE 'ISS-%';
  
  RETURN 'ISS-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Verify enums created
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_type_enum') THEN
    RAISE EXCEPTION 'Migration failed: room_type_enum not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    RAISE EXCEPTION 'Migration failed: user_role_enum not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_operation_enum') THEN
    RAISE EXCEPTION 'Migration failed: audit_operation_enum not created';
  END IF;
  
  RAISE NOTICE 'Migration 001_core_schema completed successfully';
END $$;

-- ============================================
-- NOTES
-- ============================================
-- Dependencies: None (foundation migration)
-- Breaking Changes: No
-- Data Migration: No
-- Estimated Duration: < 1 second
