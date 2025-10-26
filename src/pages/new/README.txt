# New Route Architecture

This directory contains the new route components following Epic 002 specifications.

## Routes

- Dashboard.tsx - Central hub (/)
- Facilities.tsx - Facility management (/facilities)
- FacilityDetail.tsx - Single facility view (/facilities/:id)
- Operations.tsx - Operations hub (/ops)

## Architecture

All components follow the service-layer pattern:
- NO direct Supabase imports
- Data fetching through custom hooks
- Hooks call services
- Services handle all database access

## Next Steps

1. Implement custom hooks in /src/hooks/
2. Connect hooks to services
3. Add proper TypeScript types
4. Implement filters and actions
5. Add tests
