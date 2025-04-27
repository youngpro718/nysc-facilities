
# Term Management

## Overview
The Term Management page allows administrators to manage court term schedules, assignments, and personnel. It provides tools for uploading, tracking, and managing term-related information.

## Location
- **Route**: `/terms`
- **Component**: `src/pages/TermManagement.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Term schedule management
- PDF term sheet uploading and parsing
- Term assignment tracking
- Personnel assignment to terms
- Term status monitoring
- Historical term data access

## Components Used
- **TermList**: List of all court terms
- **TermUploader**: Component for uploading term documents
- **EditTermAssignmentDialog**: Dialog for editing term assignments

## Data Sources
- Term data from Supabase (`court_terms` table)
- Term assignment data (`term_assignments` table)
- Personnel data for assignments
- Uploaded PDF documents

## Key Files
- `src/pages/TermManagement.tsx` - Main term management page
- `src/components/terms/TermList.tsx` - Term listing component
- `src/components/terms/TermUploader.tsx` - Document upload component
- `src/components/terms/EditTermAssignmentDialog.tsx` - Assignment editing dialog

## State Management
- React Query for data operations
- Upload state for document handling
- Form state for assignment creation and editing
- Filter state for term list filtering

## Visual Elements
- List view of terms with key information
- Document upload interface
- Status badges for term states
- Assignment counts and details
- PDF download links

## Data Structure
- Term records with metadata
- Assignment records linked to terms
- Personnel assignments
- Document storage for term sheets

## Screenshots
[Add screenshots here]

## Future Improvements
- Advanced document parsing capabilities
- Calendar view of term schedules
- Conflict detection for personnel assignments
- Automated notifications for upcoming terms
- Integration with court scheduling systems
