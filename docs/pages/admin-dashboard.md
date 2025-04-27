
# Admin Dashboard

## Overview
The admin dashboard serves as the central hub for administrators to manage all aspects of the NYSC Facilities Hub. It provides a comprehensive overview of the facility management system with access to various management modules.

## Location
- **Route**: `/`
- **Component**: `src/pages/AdminDashboard.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Building management overview
- Statistics on facility usage and issues
- Quick access to key management functions
- Activity feed and notifications
- Performance metrics and analytics

## Components Used
- **Building Statistics**: Displays metrics about building usage
- **Issue Tracking Components**: Shows recent and critical issues
- **Quick Access Menu**: Provides shortcuts to frequently used functions
- **Activity Feed**: Displays recent activities in the system
- **Notification System**: Alerts for important events

## Data Sources
- Building data from Supabase
- Issue statistics
- User activity logs
- System notifications

## Key Files
- `src/pages/AdminDashboard.tsx` - Main admin dashboard component
- `src/components/dashboard/BuildingStats.tsx` - Building statistics component
- `src/components/dashboard/BuildingIssues.tsx` - Issues summary component
- `src/components/dashboard/BuildingActivities.tsx` - Activity feed
- `src/hooks/useAdminDashboardData.ts` - Data fetching for admin dashboard

## State Management
- Uses React Query for data fetching and caching
- Real-time updates via Supabase subscriptions
- Local state for UI interactions

## Visual Elements
- Dashboard cards for key metrics
- Charts and graphs for statistical data
- Color-coded status indicators
- Responsive grid layout

## Screenshots
[Add screenshots here]

## Future Improvements
- Enhanced analytics and reporting tools
- Customizable dashboard widgets
- Advanced filtering options
- Predictive maintenance alerts
