# Court System Migrations

This folder contains SQL migrations for the court system components of the NYSC Facilities application.

## Available Migrations

### 1. `create_court_term_tables.sql`
- Creates the main tables for managing court terms and schedules
- Includes tables for court_terms, court_parts, term_assignments, and term_personnel

### 2. `seed_court_parts.sql`
- Seeds initial data for court parts
- Includes common part codes used in the system

### 3. `create_court_rooms_table.sql` (NEW)
- Creates the court_rooms table which is expected by the application
- Links to the main rooms table to add court-specific attributes
- Includes a trigger to automatically create court room records when rooms of type 'courtroom' are added
- Backfills existing courtrooms

## How to Apply Migrations

1. Connect to your Supabase project
2. Open the SQL Editor in the Supabase Dashboard
3. Copy and paste the content of the migration file
4. Execute the SQL statements

### Specific Instructions for `create_court_rooms_table.sql`

This migration fixes the error `relation "public.court_rooms" does not exist` that appears when the application tries to fetch term assignments. To apply:

1. Open the SQL Editor in the Supabase Dashboard
2. Copy and paste the content of `create_court_rooms_table.sql`
3. Execute the SQL
4. Restart your application

You can also apply this migration using the Supabase CLI:

```bash
supabase db diff -f create_court_rooms
# Review the generated migration
supabase migration up
```

**Note:** If you're using a development environment, make sure to apply this migration to both development and production environments as needed.

## Troubleshooting

If you encounter issues with the migrations:

1. Check that all tables exist in your database
2. Verify that the `rooms` table contains rooms with `room_type` set to 'courtroom'
3. Ensure that the trigger function has been created correctly

For any persistent issues, you may need to manually create the court_rooms table and populate it with the required data. 