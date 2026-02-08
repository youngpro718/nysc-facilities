-- Migration: Add external ticket tracking to issues
-- Allows admins to track issues that have been entered into external systems (e.g., Archibus)

-- Add external ticket tracking columns
ALTER TABLE issues 
  ADD COLUMN IF NOT EXISTS external_ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS external_system TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_ticket_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_ticket_entered_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_ticket_entered_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirmed_resolved_by_user BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confirmed_resolved_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for quick lookup by external ticket number
CREATE INDEX IF NOT EXISTS idx_issues_external_ticket ON issues(external_ticket_number) WHERE external_ticket_number IS NOT NULL;

COMMENT ON COLUMN issues.external_ticket_number IS 'Ticket number from external system (e.g., Archibus work order number)';
COMMENT ON COLUMN issues.external_system IS 'Name of the external system (e.g., Archibus)';
COMMENT ON COLUMN issues.external_ticket_status IS 'Status in external system: entered, in_progress, completed';
COMMENT ON COLUMN issues.confirmed_resolved_by_user IS 'Whether the reporting user has confirmed the issue is resolved';
