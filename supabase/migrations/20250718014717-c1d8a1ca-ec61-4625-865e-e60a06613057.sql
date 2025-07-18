-- Clean fix for security definer view issue
-- Create the view with explicit security invoker setting

-- First ensure the view doesn't exist
DROP VIEW IF EXISTS public.room_persistent_issues CASCADE;

-- Create the view with explicit security_invoker option to prevent SECURITY DEFINER
CREATE VIEW public.room_persistent_issues 
AS
SELECT 
    i.room_id,
    count(*) AS issue_count,
    count(
        CASE
            WHEN i.status = 'open'::issue_status_enum THEN 1
            ELSE NULL::integer
        END) AS open_issues,
    max(i.created_at) AS latest_issue_date
FROM public.issues i
WHERE i.status = ANY (ARRAY['open'::issue_status_enum, 'in_progress'::issue_status_enum])
  AND i.room_id IS NOT NULL
GROUP BY i.room_id
HAVING count(*) >= 3;

-- Set the view to use security invoker explicitly
ALTER VIEW public.room_persistent_issues SET (security_invoker = true);

-- Grant appropriate permissions
GRANT SELECT ON public.room_persistent_issues TO authenticated;

-- Verify the view has been created with the correct security settings
SELECT 
    schemaname,
    viewname,
    viewowner,
    substring(definition from 1 for 50) as definition_start
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'room_persistent_issues';