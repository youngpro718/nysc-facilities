
# User Dashboard

## Overview
The user dashboard provides regular users with a personalized view of the facilities system. It focuses on the user's assigned spaces, keys, and reported issues, offering a simpler interface than the admin dashboard.

## Location
- **Route**: `/dashboard`
- **Component**: `src/pages/UserDashboard.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Regular user (non-admin)
- **Protected By**: `ProtectedRoute` component

## Key Features
- Overview of assigned rooms and spaces
- Key management for assigned keys
- Issue reporting and tracking
- Personal notifications
- Quick access to commonly used functions

## Components Used
- **User Header**: Shows user information and role
- **Assigned Rooms Card**: Displays rooms assigned to the user
- **Assigned Keys Card**: Shows keys assigned to the user
- **Reported Issues Card**: Lists issues reported by the user
- **Quick Access Component**: Shortcuts to common functions

## Data Sources
- User profile data
- Room and space assignments
- Key assignments
- User-reported issues

## Key Files
- `src/pages/UserDashboard.tsx` - Main user dashboard component
- `src/components/dashboard/UserHeader.tsx` - User information header
- `src/components/dashboard/AssignedRoomsCard.tsx` - Room assignments display
- `src/components/dashboard/AssignedKeysCard.tsx` - Key assignments display
- `src/components/dashboard/ReportedIssuesCard.tsx` - Issues list
- `src/hooks/useDashboardData.ts` - Data fetching for user dashboard

## State Management
- Uses React Query for data fetching
- Local state for UI interactions
- Supabase realtime subscriptions for updates

## Visual Elements
- User profile section
- Card-based layout for different information sections
- Status indicators for issues and assignments
- Action buttons for common tasks

## Screenshots
[Add screenshots here]

## Future Improvements
- Personalization options
- Notification preferences
- Enhanced issue reporting tools
- Resource booking functionality
