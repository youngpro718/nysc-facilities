
# Keys Management

## Overview
The Keys page provides a comprehensive system for managing physical keys, electronic access cards, and other access devices. It helps track key assignments, inventory, and access privileges throughout the facility.

## Location
- **Route**: `/keys`
- **Component**: `src/pages/Keys.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Key inventory management
- Key assignment to occupants
- Key tracking and history
- Key creation and decommissioning
- Stock level monitoring
- Key audit logs

## Components Used
- **KeyInventory**: Main component for viewing all keys
- **CreateKeyDialog**: Dialog for creating new keys
- **EditKeyDialog**: Dialog for editing existing keys
- **KeyAssignmentHistory**: Shows history of key assignments
- **KeyAuditLogs**: Activity logs related to keys
- **KeyFilters**: Filtering options for keys

## Data Sources
- Key inventory data from Supabase
- Assignment history
- Occupant information
- Audit logs

## Key Files
- `src/pages/Keys.tsx` - Main keys page component
- `src/components/keys/KeyInventory.tsx` - Key inventory display
- `src/components/keys/CreateKeyDialog.tsx` - Key creation dialog
- `src/components/keys/EditKeyDialog.tsx` - Key editing dialog
- `src/components/keys/KeyAssignmentHistory.tsx` - Assignment history
- `src/components/keys/KeyAuditLogs.tsx` - Audit logs component
- `src/components/keys/KeyFilters.tsx` - Filtering component
- `src/components/keys/hooks/useKeyAssignments.ts` - Data fetching for assignments

## State Management
- React Query for data operations
- Form state for key creation and editing
- Filter state for inventory filtering
- Modal state for dialogs

## Visual Elements
- Inventory table with key details
- Status indicators for keys
- Assignment status visualization
- History and audit log displays
- Stock level indicators

## Screenshots
[Add screenshots here]

## Future Improvements
- Electronic key system integration
- QR code generation for key tracking
- Mobile app for key checkout/checkin
- Automated key assignment recommendations
- Advanced security monitoring
