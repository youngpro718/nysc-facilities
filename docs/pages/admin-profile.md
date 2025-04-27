
# Admin Profile Page

## Overview
The Admin Profile page provides additional administrative features beyond the standard profile page. It includes system management tools, user verification capabilities, and advanced reporting options.

## Location
- **Route**: `/admin-profile`
- **Component**: `src/pages/AdminProfile.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- All standard profile features
- System settings management
- User verification control
- Database backup and restore
- Activity logs monitoring
- Report generation and scheduling

## Components Used
- **ProfileHeader**: Admin profile header
- **DatabaseSection**: Database management tools
- **VerificationSection**: User verification tools
- **SystemSettingsSection**: System configuration
- **ActivityLogsSection**: Activity monitoring
- **ReportsSection**: Report generation tools

## Data Sources
- Admin profile data
- System configuration data
- User verification queue
- Activity logs
- Report templates

## Key Files
- `src/pages/AdminProfile.tsx` - Main admin profile page
- `src/components/profile/admin/components/ProfileHeader/index.tsx` - Admin header
- `src/components/profile/DatabaseSection.tsx` - Database management
- `src/components/profile/sections/VerificationSection.tsx` - User verification
- `src/components/profile/sections/SystemSettingsSection.tsx` - System settings
- `src/components/profile/sections/ActivityLogsSection.tsx` - Activity logs
- `src/components/profile/reports/ReportsSection.tsx` - Reporting tools
- `src/components/profile/admin/hooks/useAdminProfile.ts` - Admin data hooks

## State Management
- Form state for settings
- Query state for admin data
- Mutation state for system changes
- Upload/download state for backup/restore

## Visual Elements
- Admin profile header
- System metrics dashboard
- User verification interface
- Backup/restore controls
- Log viewer
- Report generation interface

## Screenshots
[Add screenshots here]

## Future Improvements
- Enhanced system analytics
- Advanced user management tools
- Automated database maintenance
- Custom report templates
- Advanced log analysis tools
