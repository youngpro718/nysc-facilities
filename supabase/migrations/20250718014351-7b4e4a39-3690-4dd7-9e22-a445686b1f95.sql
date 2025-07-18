-- Completely remove and recreate the view to eliminate any SECURITY DEFINER properties
-- First, check if the view exists and drop it completely
DROP VIEW IF EXISTS public.room_persistent_issues CASCADE;

-- Now recreate the view ensuring no SECURITY DEFINER property is set
CREATE OR REPLACE VIEW public.room_persistent_issues AS
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
WHERE issues.status = ANY (ARRAY['open'::issue_status_enum, 'in_progress'::issue_status_enum])
  AND issues.room_id IS NOT NULL
GROUP BY issues.room_id
HAVING count(*) >= 3;

-- Grant appropriate permissions to the view
GRANT SELECT ON public.room_persistent_issues TO authenticated;
GRANT SELECT ON public.room_persistent_issues TO anon;

-- Verify the view definition doesn't have SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'room_persistent_issues';