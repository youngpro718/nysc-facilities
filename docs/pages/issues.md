
# Issues Management

## Overview
The Issues page provides a comprehensive system for managing facility-related problems, maintenance requests, and incidents. It allows administrators to track, assign, and resolve issues across the facility.

## Location
- **Route**: `/issues`
- **Component**: `src/pages/Issues.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Issue creation and submission
- Issue tracking and status updates
- Assignment to personnel
- Priority management
- Filter and sort capabilities
- Issue resolution workflow
- Photo attachments for issues
- Issue history and audit trail

## Components Used
- **IssuesList**: Main list of issues
- **IssueFilters**: Filtering options for issues
- **IssueCard**: Card view of an issue
- **IssueDialog**: Detailed view and editing of issues
- **CreateIssueForm**: Form for creating new issues
- **IssuePhotoUpload**: Component for adding photos to issues

## Data Sources
- Issues data from Supabase
- Associated spaces and locations
- Personnel data for assignments
- Photo attachments

## Key Files
- `src/pages/Issues.tsx` - Main issues page component
- `src/components/issues/IssuesList.tsx` - Issues list component
- `src/components/issues/IssueFilters.tsx` - Filtering component
- `src/components/issues/card/IssueCard.tsx` - Card representation of issues
- `src/components/issues/IssueDialog.tsx` - Issue details dialog
- `src/components/issues/CreateIssueForm.tsx` - Issue creation form
- `src/components/issues/wizard/IssueWizard.tsx` - Guided issue creation
- `src/components/issues/hooks/useIssueQueries.ts` - Data fetching for issues

## State Management
- React Query for data operations
- Form state for issue creation and editing
- Filter state for list filtering
- Upload state for photo management

## Visual Elements
- List/card toggle for different views
- Status badges for issue states
- Priority indicators
- Filter and sort controls
- Photo gallery for issue images
- Timeline for issue history

## Screenshots
[Add screenshots here]

## Future Improvements
- Automated issue detection
- Integration with preventive maintenance
- Mobile app integration for on-site reporting
- Statistical analysis of common issues
- Predictive maintenance based on issue patterns
