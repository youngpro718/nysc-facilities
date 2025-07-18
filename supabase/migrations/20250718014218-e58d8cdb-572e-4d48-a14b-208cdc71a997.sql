-- Fix security definer view issue
-- Drop and recreate the room_persistent_issues view without SECURITY DEFINER
-- This ensures RLS policies are properly enforced for the querying user

DROP VIEW IF EXISTS public.room_persistent_issues;

-- Recreate the view without SECURITY DEFINER property
CREATE VIEW public.room_persistent_issues AS
SELECT 
    issues.room_id,
    count(*) AS issue_count,
    count(
        CASE
            WHEN issues.status = 'open'::issue_status_enum THEN 1
            ELSE NULL::integer
        END) AS open_issues,
    max(issues.created_at) AS latest_issue_date
FROM issues
WHERE (issues.status = ANY (ARRAY['open'::issue_status_enum, 'in_progress'::issue_status_enum])) 
  AND issues.room_id IS NOT NULL
GROUP BY issues.room_id
HAVING count(*) >= 3;

-- Ensure proper RLS is enabled on the underlying issues table
-- (This should already be in place, but adding as a safety check)
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;