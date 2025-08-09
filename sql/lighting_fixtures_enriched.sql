-- Creates an enriched view that joins lighting fixtures to spaces, floors, and buildings
-- Safe to run multiple times (drops and recreates view)

-- Note: Adjust schema names if your tables live in a non-public schema.
-- Assumes tables:
--   public.lighting_fixtures (space_id, space_type, ...)
--   public.spaces (id, name, room_number, floor_id)
--   public.floors (id, name, building_id)
--   public.buildings (id, name)
--   public.rooms (id, name, room_number) -- optional fallback

create or replace view public.lighting_fixtures_enriched as
with base as (
  select
    lf.id,
    lf.name,
    lf.type,
    lf.status,
    lf.space_id,
    lf.space_type,
    lf.position,
    lf.technology,
    lf.created_at,
    lf.updated_at,
    lf.bulb_count,
    lf.ballast_issue,
    lf.requires_electrician,
    lf.reported_out_date,
    lf.replaced_date,
    lf.notes,
    -- carry room_number stored directly on fixture (legacy)
    lf.room_number as fixture_room_number
  from public.lighting_fixtures lf
),
space_join as (
  select
    b.*,
    s.name as space_name,
    coalesce(s.room_number, r.room_number, b.fixture_room_number) as room_number,
    s.floor_id
  from base b
  left join public.spaces s on s.id = b.space_id
  -- optional fallback to rooms table if some deployments used rooms
  left join public.rooms r on r.id = b.space_id
),
floor_join as (
  select
    sj.*,
    f.name as floor_name,
    f.id as floor_id_norm,
    f.building_id
  from space_join sj
  left join public.floors f on f.id = sj.floor_id
),
building_join as (
  select
    fj.*,
    b.name as building_name,
    b.id as building_id_norm
  from floor_join fj
  left join public.buildings b on b.id = fj.building_id
)
select
  id,
  name,
  type,
  status,
  space_id,
  space_type,
  position,
  technology,
  created_at,
  updated_at,
  bulb_count,
  ballast_issue,
  requires_electrician,
  reported_out_date,
  replaced_date,
  notes,
  room_number,
  space_name,
  building_name,
  floor_name,
  -- expose ids for client filtering if desired
  building_id_norm as building_id,
  floor_id_norm as floor_id
from building_join;
