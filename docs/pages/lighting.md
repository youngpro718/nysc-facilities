
# Lighting Management

## Overview
The Lighting page provides tools for managing all lighting fixtures and systems throughout the facility. It allows administrators to monitor, maintain, and control lighting infrastructure.

## Location
- **Route**: `/lighting`
- **Component**: `src/pages/Lighting.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Lighting fixture inventory
- Lighting zone management
- Maintenance scheduling and tracking
- Issue reporting for lighting systems
- Energy usage monitoring
- Lighting inspection tracking

## Components Used
- **LightingDashboard**: Main dashboard for lighting overview
- **LightingFixturesList**: List of all lighting fixtures
- **LightingZonesList**: List of defined lighting zones
- **CreateLightingDialog**: Dialog for adding new fixtures
- **EditLightingDialog**: Dialog for editing fixtures
- **MaintenanceView**: View for maintenance scheduling
- **ScheduleMaintenanceDialog**: Dialog for scheduling maintenance

## Data Sources
- Lighting fixture data from Supabase
- Lighting zone definitions
- Maintenance records
- Inspection history
- Energy usage data

## Key Files
- `src/pages/Lighting.tsx` - Main lighting page component
- `src/components/lighting/LightingDashboard.tsx` - Overview dashboard
- `src/components/lighting/LightingFixturesList.tsx` - Fixtures list
- `src/components/lighting/LightingZonesList.tsx` - Zones list
- `src/components/lighting/CreateLightingDialog.tsx` - Fixture creation dialog
- `src/components/lighting/EditLightingDialog.tsx` - Fixture editing dialog
- `src/components/lighting/MaintenanceView.tsx` - Maintenance management
- `src/components/lighting/hooks/useLightingFixtures.ts` - Data fetching

## State Management
- React Query for data operations
- Form state for fixture creation and editing
- Filter state for list filtering
- Modal state for dialogs

## Visual Elements
- Dashboard with key metrics
- Interactive fixture maps
- Status indicators for fixtures
- Maintenance schedule calendar
- Energy usage charts

## Screenshots
[Add screenshots here]

## Future Improvements
- Smart lighting integration
- Automated energy efficiency recommendations
- Motion sensor integration
- Mobile app for on-site fixture management
- Advanced analytics for energy usage patterns
