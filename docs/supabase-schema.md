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

### 4. Doors
**Table Name:** `doors`
```sql
CREATE TABLE doors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  type door_type_enum NOT NULL,
  status status_enum NOT NULL DEFAULT 'active',
  security_level TEXT DEFAULT 'standard',
  passkey_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doors_floor_id ON doors(floor_id);
CREATE INDEX idx_doors_status ON doors(status);
```
- **Purpose:** Manages door information and access control
- **Relationships:**
  - Belongs to a floor (`floor_id`)
- **Key Fields:**
  - `name`: Door identifier/name
  - `type`: Type of door (standard/emergency/secure/maintenance)
  - `status`: Current status (active/inactive/under_maintenance)
  - `security_level`: Access security level
  - `passkey_enabled`: Whether electronic access is enabled

### 5. Issues
**Table Name:** `issues`
```sql
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  type issue_type_enum NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to party_enum NOT NULL,
  status issue_status_enum DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  photos TEXT[] DEFAULT '{}',
  building_id UUID REFERENCES buildings(id),
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  sla_hours INTEGER DEFAULT 48,
  status_history JSONB[] DEFAULT '{}',
  seen BOOLEAN DEFAULT false,
  floor_id UUID REFERENCES floors(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Tracks maintenance issues and their resolution
- **Enums:**
  - `issue_type_enum`: 'HVAC' | 'Leak' | 'Electrical' | 'Plaster' | 'Cleaning' | 'Other'
  - `issue_status_enum`: 'open' | 'in_progress' | 'resolved'
  - `party_enum`: 'DCAS' | 'OCA' | 'Self' | 'Outside_Vendor'

### 6. Lighting Fixtures
**Table Name:** `lighting_fixtures`
```sql
CREATE TABLE lighting_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type light_fixture_type_enum NOT NULL,
  status light_status_enum DEFAULT 'functional',
  installation_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_notes TEXT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  maintenance_priority TEXT,
  zone_id UUID REFERENCES lighting_zones(id),
  scheduled_maintenance_date DATE,
  maintenance_frequency_days INTEGER DEFAULT 90,
  last_scheduled_by UUID REFERENCES profiles(id),
  maintenance_history JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Manages lighting fixture information and maintenance
- **Enums:**
  - `light_fixture_type_enum`: 'standard' | 'emergency' | 'motion_sensor'
  - `light_status_enum`: 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement'

### 7. Lighting Zones
**Table Name:** `lighting_zones`
```sql
CREATE TABLE lighting_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  floor_id UUID REFERENCES floors(id),
  type zone_type_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Manages lighting zones within floors
- **Relationships:**
  - Belongs to a floor (`floor_id`)
- **Key Fields:**
  - `name`: Zone name/designation
  - `type`: Zone type (general/emergency/restricted)
  - `floor_id`: Reference to the floor this zone belongs to

### 8. Keys
**Table Name:** `keys`
```sql
CREATE TABLE keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type key_type_enum NOT NULL,
  status key_status_enum DEFAULT 'available',
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  door_id UUID REFERENCES doors(id),
  is_passkey BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Tracks physical keys and access devices
- **Enums:**
  - `key_type_enum`: 'physical_key' | 'elevator_pass'
  - `key_status_enum`: 'available' | 'assigned' | 'lost' | 'decommissioned'

### 9. Occupants
**Table Name:** `occupants`
```sql
CREATE TABLE occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  status TEXT DEFAULT 'active',
  room_id UUID REFERENCES rooms(id),
  title TEXT,
  start_date DATE,
  end_date DATE,
  access_level TEXT DEFAULT 'standard',
  emergency_contact JSONB DEFAULT '{"name": null, "phone": null, "relationship": null}',
  notes TEXT,
  assigned_resources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Manages occupant information and assignments

### 10. Profiles
**Table Name:** `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'light',
  phone TEXT,
  department TEXT,
  title TEXT,
  last_login TIMESTAMPTZ,
  job_title_validated BOOLEAN DEFAULT false,
  notification_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
- **Purpose:** Stores user profile information
- **Relationships:**
  - Links to Supabase auth users

## Views

### 1. Room Occupancy Stats
**View Name:** `room_occupancy_stats`
- Provides current occupancy information for rooms
- Includes department distribution and occupancy status

### 2. Maintenance Summary
**View Name:** `maintenance_summary`
- Summarizes maintenance needs by floor
- Tracks fixtures needing maintenance and maintenance schedules

### 3. Key Inventory Stats
**View Name:** `key_inventory_stats`
- Provides key inventory and assignment statistics
- Tracks current assignments and key status

## Enums

### Status Enum
```sql
CREATE TYPE status_enum AS ENUM (
  'active',
  'inactive',
  'under_maintenance'
);
```

### Access Level Enum
```sql
CREATE TYPE access_level_enum AS ENUM (
  'none',
  'read',
  'write',
  'admin'
);
```

### Direction Enum
```sql
CREATE TYPE direction_enum AS ENUM (
  'north',
  'south',
  'east',
  'west',
  'adjacent'
);
```

### Door Type Enum
```sql
CREATE TYPE door_type_enum AS ENUM (
  'standard',
  'emergency',
  'secure',
  'maintenance'
);
```

### Zone Type Enum
```sql
CREATE TYPE zone_type_enum AS ENUM (
  'general',
  'emergency',
  'restricted'
);
```

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
    NEW.previous_functions = array_append(NEW.previous_functions, jsonb_build_object(
        'function', OLD.current_function,
        'date', OLD.function_change_date
    ));
    NEW.function_change_date = CURRENT_TIMESTAMP;
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
    NEW.status_history = array_append(NEW.status_history, jsonb_build_object(
        'status', OLD.status,
        'updated_at', OLD.updated_at
    ));
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
