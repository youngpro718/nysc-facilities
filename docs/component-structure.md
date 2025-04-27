
# Component Structure

## Overview
This document outlines the component organization and structure in the NYSC Facilities Hub application. The app follows a modular component-based architecture with reusable UI elements and domain-specific components.

## Component Organization

### UI Components
Located in `src/components/ui/`, these are generic, reusable UI elements that form the building blocks of the application interface. Built on top of Shadcn UI library.

Key UI Components:
- **Button**: Various button styles and variants
- **Card**: Container components for content sections
- **Input**: Form input elements
- **Table**: Data display in tabular format
- **Dialog**: Modal dialogs
- **Tabs**: Tabbed interface components
- **Badge**: Status indicators
- **Tooltip**: Information tooltips
- **Sidebar**: Navigation sidebar
- **SparklesCore**: Animated background effects

### Domain-Specific Components
Organized by feature area in separate directories under `src/components/`:

#### Authentication Components (`src/components/auth/`)
- **AuthForm**: Handles authentication UI
- **ProtectedRoute**: Route protection wrapper
- **LoginForm**: Form for user login

#### Layout Components (`src/components/layout/`)
- **Layout**: Main application layout
- **DesktopNavigation**: Desktop navigation menu
- **MobileMenu**: Mobile navigation menu

#### Dashboard Components (`src/components/dashboard/`)
- **BuildingStats**: Building statistics card
- **BuildingIssues**: Issues summary card
- **BuildingActivities**: Activity feed
- **QuickAccess**: Quick access menu

#### Spaces Components (`src/components/spaces/`)
- **RoomsList/HallwaysList/DoorsList**: Lists of spaces
- **SpaceCard**: Card for individual spaces
- **CreateSpaceDialog**: Dialog for creating spaces
- **FloorPlanView**: Visual space representation

#### Issues Components (`src/components/issues/`)
- **IssuesList**: List of facility issues
- **IssueCard**: Card for individual issues
- **CreateIssueForm**: Form for creating issues
- **IssueWizard**: Step-by-step issue creation

#### Occupants Components (`src/components/occupants/`)
- **OccupantListView**: List of facility occupants
- **OccupantCard**: Card for individual occupants
- **CreateOccupantDialog**: Dialog for creating occupants

#### Keys Components (`src/components/keys/`)
- **KeyInventory**: Key inventory management
- **CreateKeyDialog**: Dialog for creating keys
- **KeyAssignmentHistory**: Key assignment history

#### Lighting Components (`src/components/lighting/`)
- **LightingDashboard**: Lighting management dashboard
- **LightingFixturesList**: List of lighting fixtures
- **CreateLightingDialog**: Dialog for creating fixtures

#### Term Components (`src/components/terms/`)
- **TermList**: List of court terms
- **TermUploader**: Upload interface for term sheets

#### Relocation Components (`src/components/relocations/`)
- **RelocationsDashboard**: Relocation management dashboard
- **CreateRelocationForm**: Form for creating relocations

## Component Patterns

### Composite Components
Many complex features use a composition pattern, where larger components are built from smaller, specialized components:

```
IssueCard/
  ├── CardFront.tsx
  ├── CardBack.tsx
  ├── IssueMetadata.tsx
  ├── IssueComments.tsx
  └── IssueStatusBadge.tsx
```

### Feature-Specific Organization
Components are often organized into subdirectories by feature, with common patterns:

```
feature/
  ├── components/      # Presentational components
  ├── hooks/           # Feature-specific hooks
  ├── utils/           # Utility functions
  ├── types/           # TypeScript type definitions
  └── schemas/         # Validation schemas
```

### Smart and Presentational Components
The app follows a pattern of separating:
- **Smart Components**: Handle data fetching, state, and logic
- **Presentational Components**: Focus purely on rendering UI

### Form Composition
Complex forms are built using a section-based approach:

```
forms/
  ├── CreateIssueForm.tsx       # Main form component
  └── form-sections/            # Form sections
      ├── BasicIssueFields.tsx
      ├── LocationFields.tsx
      └── StatusAndPriorityFields.tsx
```

## Component Communication
- **Props**: For parent-child communication
- **Context API**: For global state like authentication
- **Custom Hooks**: For shared logic and state
- **Event Handlers**: For component interactions
- **React Query**: For server state management

## Reusability Patterns
- **Component Composition**: Building complex UIs from simple parts
- **Render Props**: Allowing components to control rendering
- **Custom Hooks**: Extracting and sharing stateful logic
- **Higher-Order Components**: Enhancing components with additional functionality

## Component Documentation
- TypeScript interfaces for prop definitions
- JSDoc comments for complex components
- Consistent naming conventions
