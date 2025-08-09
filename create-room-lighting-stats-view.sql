-- Creates a per-room lighting stats view used by the UI
-- Safe to run multiple times
create or replace view room_lighting_stats_v as
with fixtures as (
  select
    f.space_id as room_id,
    s.name as room_name,
    s.room_number,
    count(*) filter (where true) as fixture_count,
    count(*) filter (
      where f.reported_out_date is not null and f.replaced_date is null
    ) as open_issues_total,
    count(*) filter (
      where f.reported_out_date is not null and f.replaced_date is null
        and coalesce(f.requires_electrician, false) = false
    ) as open_replaceable,
    count(*) filter (
      where f.reported_out_date is not null and f.replaced_date is null
        and coalesce(f.requires_electrician, false) = true
    ) as open_electrician,
    -- average duration for resolved issues in minutes
    round(
      avg(
        extract(epoch from (f.replaced_date - f.reported_out_date)) / 60
      )::numeric
    )::int as mttr_minutes,
    -- longest currently open duration in minutes
    round(
      max(
        case
          when f.reported_out_date is not null and f.replaced_date is null
          then extract(epoch from (now() - f.reported_out_date)) / 60
          else null
        end
      )::numeric
    )::int as longest_open_minutes
  from lighting_fixtures f
  left join spaces s on s.id = f.space_id
  group by 1,2,3
)
select *, 
  -- example SLA: 72 hours (4320 minutes)
  coalesce((longest_open_minutes > 4320)::int, 0)::boolean as has_sla_breach
from fixtures;
