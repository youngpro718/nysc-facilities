-- Fix the audit log foreign key constraint issue
-- Remove the foreign key constraint so audit logs can persist after deletions
ALTER TABLE public.room_assignment_audit_log 
DROP CONSTRAINT IF EXISTS room_assignment_audit_log_assignment_id_fkey;

-- The assignment_id column will remain as a uuid but without the foreign key constraint
-- This allows us to keep historical records even after assignments are deleted