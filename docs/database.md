
# Database Documentation

## Schema Overview

### Spaces

#### rooms
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  floor_id UUID REFERENCES floors(id),
  room_number TEXT,
  room_type TEXT,
  status TEXT DEFAULT 'active',
  current_function TEXT,
  function_change_date TIMESTAMP,
  previous_functions JSONB[]
);
```

#### hallways
```sql
CREATE TABLE hallways (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  floor_id UUID REFERENCES floors(id),
  type TEXT,
  section TEXT,
  status TEXT DEFAULT 'active'
);
```

#### doors
```sql
CREATE TABLE doors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  floor_id UUID REFERENCES floors(id),
  type TEXT,
  status TEXT DEFAULT 'active',
  security_level TEXT,
  passkey_enabled BOOLEAN DEFAULT false
);
```

### Connections

#### space_connections
```sql
CREATE TABLE space_connections (
  id UUID PRIMARY KEY,
  from_space_id UUID NOT NULL,
  to_space_id UUID NOT NULL,
  space_type TEXT NOT NULL,
  connection_type TEXT NOT NULL,
  direction TEXT,
  position TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB
);
```

### Occupants

#### occupants
```sql
CREATE TABLE occupants (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  title TEXT,
  status TEXT DEFAULT 'active'
);
```

#### occupant_room_assignments
```sql
CREATE TABLE occupant_room_assignments (
  id UUID PRIMARY KEY,
  occupant_id UUID REFERENCES occupants(id),
  room_id UUID REFERENCES rooms(id),
  assignment_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Key Relationships

### Space Connections
- Rooms ↔ Hallways
- Rooms ↔ Doors
- Hallways ↔ Doors

### Occupant Assignments
- Occupants → Rooms
- Occupants → Keys

## Functions and Triggers

### Room Management
```sql
CREATE OR REPLACE FUNCTION update_room_function_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_function IS DISTINCT FROM OLD.current_function THEN
    NEW.previous_functions = array_append(
      COALESCE(OLD.previous_functions, ARRAY[]::jsonb[]),
      jsonb_build_object(
        'function', OLD.current_function,
        'start_date', OLD.function_change_date,
        'end_date', CURRENT_TIMESTAMP,
        'changed_by', auth.uid()
      )
    );
    NEW.function_change_date = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Connection Management
```sql
CREATE OR REPLACE FUNCTION update_space_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## RLS Policies

### Space Access
```sql
CREATE POLICY "Public spaces are viewable by all users"
ON spaces
FOR SELECT
USING (status = 'active');
```

### Occupant Access
```sql
CREATE POLICY "Users can view their own assignments"
ON occupant_room_assignments
FOR SELECT
USING (occupant_id = auth.uid());
```

## Indexes
```sql
CREATE INDEX idx_space_connections_from_space ON space_connections(from_space_id);
CREATE INDEX idx_space_connections_to_space ON space_connections(to_space_id);
CREATE INDEX idx_occupant_assignments_room ON occupant_room_assignments(room_id);
```

## Views

### occupant_details
```sql
CREATE VIEW occupant_details AS
SELECT 
  o.*,
  COUNT(DISTINCT ora.room_id) as room_count,
  COUNT(DISTINCT ka.key_id) as key_count
FROM occupants o
LEFT JOIN occupant_room_assignments ora ON o.id = ora.occupant_id
LEFT JOIN key_assignments ka ON o.id = ka.occupant_id
GROUP BY o.id;
```
