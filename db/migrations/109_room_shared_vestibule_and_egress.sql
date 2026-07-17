-- Add shared_vestibule and egress as room types.
--
-- shared_vestibule: a room that functions as a shared hallway/entryway
-- connecting several other offices (e.g. 1311).
-- egress: a room that doubles as an emergency escape route between two
-- other spaces, in addition to whatever else it's used for (e.g. 738,
-- used for water cooler/copy paper storage but also an egress).

ALTER TYPE room_type_enum ADD VALUE IF NOT EXISTS 'shared_vestibule';
ALTER TYPE room_type_enum ADD VALUE IF NOT EXISTS 'egress';
