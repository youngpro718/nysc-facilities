
# Profile Page

## Overview
The Profile page allows regular users to view and manage their personal information, preferences, and system settings. It provides a personalized interface for user configuration.

## Location
- **Route**: `/profile`
- **Component**: `src/pages/Profile.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Any authenticated user
- **Protected By**: `ProtectedRoute` component

## Key Features
- Personal information management
- Contact information updates
- Notification preferences
- Security settings
- System preferences

## Components Used
- **ProfileHeader**: User profile header and summary
- **PersonalInfoForm**: Form for updating personal information
- **NotificationPreferences**: Settings for notifications
- **SecuritySection**: Password and security settings

## Data Sources
- User profile data from Supabase
- User preferences
- Security settings

## Key Files
- `src/pages/Profile.tsx` - Main profile page component
- `src/components/profile/ProfileHeader.tsx` - Profile header component
- `src/components/profile/PersonalInfoForm.tsx` - Personal information form
- `src/components/profile/NotificationPreferences.tsx` - Notification settings
- `src/components/profile/SecuritySection.tsx` - Security settings component
- `src/components/profile/hooks/useProfileForm.ts` - Form handling

## State Management
- Form state for profile editing
- Query state for profile data
- Mutation state for updates

## Visual Elements
- Profile header with user image
- Form sections for different settings
- Save and reset controls
- Confirmation dialogs for sensitive changes

## Screenshots
[Add screenshots here]

## Future Improvements
- Profile image upload
- Advanced notification settings
- Activity log review
- Integration with external accounts
- Two-factor authentication options
