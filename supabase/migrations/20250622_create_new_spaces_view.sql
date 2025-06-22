-- Create a unified view for all spaces to support joins in space_connections queries
CREATE OR REPLACE VIEW new_spaces AS
SELECT
  id,
  name,
  'room' AS type,
  room_number,
  status
FROM rooms
UNION ALL
SELECT
  id,
  name,
  'hallway' AS type,
  NULL AS room_number,
  status
FROM hallways
UNION ALL
SELECT
  id,
  name,
  'door' AS type,
  NULL AS room_number,
  status
FROM doors;
