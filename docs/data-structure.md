
# Data Structure

## Overview
This document outlines the data structure and database organization of the NYSC Facilities Hub application. The app uses a Supabase PostgreSQL database with multiple interconnected tables to manage spaces, occupants, issues, and other facility management entities.

## Database Schema

### Core Tables

#### Spaces Management
- **rooms**: Physical rooms in the facilities
- **hallways**: Connecting passages between spaces
- **doors**: Entry/exit points connecting spaces
- **space_connections**: Relationships between different spaces
- **buildings**: Buildings containing spaces
- **floors**: Floors within buildings

#### People Management
- **profiles**: Extended user profile information
- **occupants**: People who use the facilities
- **user_roles**: Role assignments for system users
- **user_sessions**: Active user sessions

#### Access Management
- **keys**: Physical and electronic access devices
- **key_assignments**: Assignments of keys to occupants
- **key_inventory**: Stock levels for keys

#### Issue Management
- **issues**: Reported problems and maintenance requests
- **issue_comments**: Comments on issues
- **issue_history**: Historical record of issue changes
- **issue_photos**: Images attached to issues

#### Lighting Management
- **lighting_fixtures**: Individual lighting devices
- **lighting_zones**: Grouped lighting areas
- **lighting_maintenance**: Maintenance records for lighting

#### Term Management
- **court_terms**: Court term schedules
- **term_assignments**: Assignments for court terms
- **term_personnel**: Personnel assigned to terms

#### Relocation Management
- **relocations**: Planned moves
- **relocation_items**: Items to be relocated
- **schedule_changes**: Changes to relocation schedules

### Authentication Tables
- **auth.users**: Supabase-managed user accounts
- **profiles**: Extended user information linked to auth.users

## Relationships

### Space Relationships
- Rooms belong to floors
- Floors belong to buildings
- Doors connect spaces
- Hallways connect spaces
- Spaces can have multiple connections

### Occupant Relationships
- Occupants can be assigned multiple rooms
- Occupants can be assigned multiple keys
- Occupants can report multiple issues

### Issue Relationships
- Issues are associated with spaces
- Issues can have multiple photos
- Issues can have multiple comments
- Issues have a history of changes

## Data Access Patterns

### Row-Level Security
- Users can only access their own data
- Admins can access all data
- Custom policies for specific tables

### Common Queries
- Filtering spaces by building and floor
- Finding occupants assigned to specific rooms
- Retrieving issues by status or location
- Tracking key assignments

## Data Storage

### File Storage
- Issue photos stored in Supabase Storage
- Term PDFs stored in Supabase Storage
- Profile avatars stored in Supabase Storage

### Large Object Handling
- PDFs and images use Supabase Storage buckets
- Metadata stored in database with references

## Data Integrity

### Foreign Key Constraints
- Ensures referential integrity between related tables
- Prevents orphaned records

### Validation Rules
- Data type constraints
- Required fields
- Format validation

### Triggers and Functions
- Automatic timestamp updates
- Cascade operations
- Validation logic
