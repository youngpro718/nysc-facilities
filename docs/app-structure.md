
# Application Structure

## Overview
This document provides a high-level overview of the NYSC Facilities Hub application structure, key technologies used, and architectural patterns employed.

## Key Technologies

### Frontend
- **React**: UI library
- **TypeScript**: Static typing
- **React Router**: Routing
- **React Query**: Data fetching and state management
- **Tailwind CSS**: Styling
- **Shadcn UI**: Component library
- **Lucide React**: Icon library
- **Recharts**: Charting
- **Three.js**: 3D visualization
- **React Three Fiber**: Three.js React integration

### Backend
- **Supabase**: Backend-as-a-Service
  - Authentication
  - Database
  - Storage
  - Realtime subscriptions
  - Edge Functions

## Project Structure

### Root Directory Structure
- `src/`: Source code
- `public/`: Static assets
- `docs/`: Documentation
- `supabase/`: Supabase configuration and migrations

### Source Code Organization
- `src/components/`: Reusable UI components
- `src/pages/`: Application pages
- `src/hooks/`: Custom React hooks
- `src/contexts/`: Context providers
- `src/integrations/`: Integration with external services
- `src/lib/`: Utility libraries
- `src/utils/`: Utility functions
- `src/styles/`: Global styles

### Key Architectural Patterns
- Component-based architecture
- Context API for global state
- Custom hooks for reusable logic
- Page-based routing
- Server state management with React Query
- Type-safe development with TypeScript

## Authentication Flow
- User authentication via Supabase Auth
- Role-based access control (Admin vs Regular users)
- Protected routes with the ProtectedRoute component
- Session management and persistence

## Data Flow
- React Query for data fetching, caching, and mutations
- Supabase client for database operations
- Real-time updates via Supabase subscriptions
- Local state for UI interactions

## UI Architecture
- Responsive design with Tailwind CSS
- Component composition with Shadcn UI
- Custom UI components for specific features
- Various visualization techniques (2D, 3D, charts)

## Key Features Structure
- Space management (rooms, hallways, doors)
- Issue tracking and resolution
- Occupant management
- Key management
- Lighting systems
- Term scheduling
- Relocation planning

## Deployment and Building
- Vite for development and building
- Environment configuration
- Static site deployment

## Documentation
- Code documentation
- User documentation
- API documentation
