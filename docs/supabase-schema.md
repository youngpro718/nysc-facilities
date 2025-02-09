
# Supabase Database Schema Documentation

## Overview
This document provides a detailed overview of the database schema for the NYSC Facilities Hub application. The schema is organized into multiple tables that handle various aspects of facility management including spaces, occupants, keys, lighting, and issues.

## Tables

### 1. Buildings
**Table Name:** `buildings`
```sql
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  status status_enum DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Stores information about different buildings in the facility
- **Key Fields:**
  - `id`: Unique identifier for each building
  - `name`: Building name
  - `address`: Physical address
  - `status`: Current status (active/inactive/under_maintenance)

### 2. Floors
**Table Name:** `floors`
```sql
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  floor_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  status status_enum DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Manages floor information within buildings
- **Relationships:**
  - Belongs to a building (`building_id`)
- **Key Fields:**
  - `floor_number`: Numerical floor identifier
  - `name`: Floor name/designation

### 3. Rooms
**Table Name:** `rooms`
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id),
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  description TEXT,
  status status_enum DEFAULT 'active',
  parent_room_id UUID REFERENCES rooms(id),
  is_storage BOOLEAN DEFAULT false,
  storage_capacity NUMERIC,
  storage_type TEXT,
  storage_notes TEXT,
  last_inventory_check TIMESTAMPTZ,
  room_type room_type_enum DEFAULT 'office',
  previous_functions JSONB[] DEFAULT '{}',
  function_change_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  current_function TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Stores room information and characteristics
- **Relationships:**
  - Belongs to a floor (`floor_id`)
  - Can have a parent room (`parent_room_id`)
- **Enums:**
  - `room_type_enum`: 'courtroom' | 'judges_chambers' | 'jury_room' | 'conference_room' | 'office' | 'filing_room' | 'male_locker_room' | 'female_locker_room' | 'robing_room' | 'stake_holder' | 'records_room' | 'administrative_office' | 'break_room' | 'it_room' | 'utility_room'

### 4. Lighting Fixtures
**Table Name:** `lighting_fixtures`
```sql
CREATE TABLE lighting_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type lighting_fixture_type_enum NOT NULL,
  status light_status_enum DEFAULT 'functional',
  technology lighting_technology_enum,
  electrical_issues JSONB DEFAULT '{"short_circuit": false, "wiring_issues": false, "voltage_problems": false}',
  ballast_issue BOOLEAN DEFAULT false,
  emergency_circuit BOOLEAN DEFAULT false,
  bulb_count INTEGER DEFAULT 1,
  space_id UUID,
  space_type TEXT,
  position lighting_position_enum DEFAULT 'ceiling',
  sequence_number INTEGER,
  zone_id UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW lighting_fixture_details AS
SELECT 
  f.*,
  r.room_number,
  r.name as space_name,
  fl.name as floor_name,
  b.name as building_name,
  fl.id as floor_id,
  b.id as building_id
FROM lighting_fixtures f
LEFT JOIN rooms r ON f.space_id = r.id AND f.space_type = 'room'
LEFT JOIN floors fl ON r.floor_id = fl.id
LEFT JOIN buildings b ON fl.building_id = b.id;
```
- **Purpose:** Manages lighting fixture information and maintenance
- **Relationships:**
  - Can be associated with a space (`space_id`)
  - Can belong to a zone (`zone_id`)
- **Enums:**
  - `lighting_fixture_type_enum`: 'standard' | 'emergency' | 'motion_sensor'
  - `light_status_enum`: 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement'
  - `lighting_position_enum`: 'ceiling' | 'wall' | 'floor' | 'desk'
  - `lighting_technology_enum`: 'LED' | 'Fluorescent' | 'Bulb'

### 5. Lighting Zones
**Table Name:** `lighting_zones`
```sql
CREATE TABLE lighting_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  floor_id UUID REFERENCES floors(id),
  type TEXT NOT NULL,
  parent_zone_id UUID REFERENCES lighting_zones(id),
  zone_path TEXT[],
  floor_coverage JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Manages lighting zones within floors
- **Relationships:**
  - Belongs to a floor (`floor_id`)
  - Can have a parent zone (`parent_zone_id`)

### 6. Issues
**Table Name:** `issues`
```sql
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type issue_type_enum NOT NULL,
  status issue_status_enum DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to party_enum NOT NULL,
  room_id UUID REFERENCES rooms(id),
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  fixture_id UUID,
  photos TEXT[] DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  seen BOOLEAN DEFAULT false,
  status_history JSONB[] DEFAULT '{}',
  sla_hours INTEGER DEFAULT 48,
  due_date TIMESTAMPTZ,
  lighting_details JSONB DEFAULT '{"fixture_status": null, "detected_issues": [], "maintenance_history": []}'
);
```
- **Purpose:** Tracks maintenance issues and their resolution
- **Enums:**
  - `issue_type_enum`: 'HVAC' | 'Leak' | 'Electrical' | 'Plaster' | 'Cleaning' | 'Other'
  - `issue_status_enum`: 'open' | 'in_progress' | 'resolved'
  - `party_enum`: 'DCAS' | 'OCA' | 'Self' | 'Outside_Vendor'

## Functions and Triggers

### 1. Update Updated At
```sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
- Applied to all tables with updated_at column

### 2. Record Room History
```sql
CREATE FUNCTION record_room_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO room_history (
            room_id,
            changed_by,
            change_type,
            previous_values,
            new_values
        ) VALUES (
            NEW.id,
            auth.uid(),
            'updated',
            row_to_json(OLD),
            row_to_json(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
- Tracks changes to room configurations

### 3. Update Issue Status History
```sql
CREATE FUNCTION update_issue_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.status_history = array_append(
            COALESCE(OLD.status_history, ARRAY[]::jsonb[]),
            jsonb_build_object(
                'status', NEW.status,
                'changed_at', CURRENT_TIMESTAMP,
                'previous_status', OLD.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
- Maintains history of issue status changes

## Row Level Security (RLS)

Most tables implement RLS policies that:
1. Allow authenticated users to read data
2. Restrict write operations based on user roles and permissions
3. Enable administrative users to perform all operations

## Indexes
Key indexes are maintained on:
- Foreign key relationships
- Frequently queried fields (status, type)
- Timestamp fields for efficient date-based queries

## Notes
- All tables include created_at and updated_at timestamps
- Consistent use of UUID as primary keys
- Extensive use of foreign key constraints for referential integrity
- JSON/JSONB types used for flexible data storage where appropriate
- Enum types ensure data consistency for status and type fields
