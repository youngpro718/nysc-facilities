# Supabase Database Schema Documentation

## Overview
This document provides a detailed overview of the database schema for the NYSC Facilities Hub application. The schema is organized into multiple tables that handle various aspects of facility management including spaces, occupants, keys, lighting, and issues.

## Core Tables

### Buildings
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

### Floors
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

### Spaces
**Table Name:** `spaces`
```sql
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  space_type TEXT NOT NULL CHECK (space_type IN ('room', 'hallway')),
  room_number TEXT,
  floor_id UUID NOT NULL REFERENCES floors(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Lighting Fixtures
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
  space_id UUID REFERENCES spaces(id),
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
  s.room_number,
  s.name as space_name,
  fl.name as floor_name,
  b.name as building_name,
  fl.id as floor_id,
  b.id as building_id
FROM lighting_fixtures f
LEFT JOIN spaces s ON f.space_id = s.id
LEFT JOIN floors fl ON s.floor_id = fl.id
LEFT JOIN buildings b ON fl.building_id = b.id;
```

### Issues
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

## Enums

### Common Status Enums
```sql
CREATE TYPE status_enum AS ENUM ('active', 'inactive', 'under_maintenance');
CREATE TYPE light_status_enum AS ENUM (
  'functional',
  'maintenance_needed',
  'non_functional',
  'pending_maintenance',
  'scheduled_replacement'
);
CREATE TYPE issue_status_enum AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE party_enum AS ENUM ('DCAS', 'OCA', 'Self', 'Outside_Vendor');
```

### Lighting Specific Enums
```sql
CREATE TYPE lighting_fixture_type_enum AS ENUM ('standard', 'emergency', 'motion_sensor');
CREATE TYPE lighting_position_enum AS ENUM ('ceiling', 'wall', 'floor', 'desk');
CREATE TYPE lighting_technology_enum AS ENUM ('LED', 'Fluorescent', 'Bulb');
```

## Functions and Triggers

The database includes several functions and triggers for:
- Updating timestamps
- Recording history
- Validating data
- Managing inventory
- Handling status changes
- Managing lighting issues

For specific implementation details of functions and triggers, please refer to the migrations files.

## Row Level Security (RLS)

Most tables implement RLS policies that:
1. Allow authenticated users to read data
2. Restrict write operations based on user roles and permissions
3. Enable administrative users to perform all operations

## Notes
- All tables include created_at and updated_at timestamps
- Consistent use of UUID as primary keys
- Extensive use of foreign key constraints for referential integrity
- JSON/JSONB types used for flexible data storage where appropriate
- Enum types ensure data consistency for status and type fields

For complete schema details including all tables, views, functions, and policies, please refer to the migrations folder.
