-- 114: get_issue_stats() computed its 'critical' key by filtering on
-- priority = 'high' — issue_priority_enum is actually low/medium/high/
-- critical, so any issue genuinely marked 'critical' was invisible to this
-- function. This RPC feeds the admin dashboard's "Active Issues" stat AND
-- the red "N critical alerts require immediate attention" banner
-- (getSystemAlerts in commandCenterService.ts) — both have been silently
-- undercounting since the 'critical' priority level was added. Same root
-- cause as the Operations page "Critical queue" bug fixed client-side today.

create or replace function public.get_issue_stats()
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'total',        count(*),
    'open',         count(*) filter (where status = 'open'),
    'in_progress',  count(*) filter (where status = 'in_progress'),
    'resolved',     count(*) filter (where status = 'resolved'),
    'high',         count(*) filter (where priority = 'high'),
    'medium',       count(*) filter (where priority = 'medium'),
    'low',          count(*) filter (where priority = 'low'),
    'critical',     count(*) filter (
                      where priority in ('high', 'critical')
                        and status in ('open', 'in_progress')
                    ),
    'today',        count(*) filter (where created_at::date = current_date),
    'this_week',    count(*) filter (where created_at >= current_date - 7),
    'rooms_affected', count(distinct room_id) filter (where room_id is not null)
  )
  from issues;
$function$;
