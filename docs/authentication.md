
# Authentication System

## Overview
This document details the authentication system used in the NYSC Facilities Hub application. The app uses Supabase Authentication for identity management, with custom logic for role-based access control and verification workflows.

## Authentication Provider
- **Supabase Auth**: Handles user registration, login, session management, and token refresh

## Authentication Components
- **AuthContext**: Central context provider for authentication state
- **AuthProvider**: Wraps the application to provide authentication context
- **AuthForm**: Reusable component for login and signup
- **ProtectedRoute**: Route wrapper that enforces authentication and role requirements
- **LoginPage**: Dedicated page for authentication

## Authentication Flow

### Registration
1. User provides email, password, and basic information
2. Account is created in Supabase Auth
3. User profile is created in the profiles table
4. Account is set to "pending" verification status
5. User is directed to verification pending page

### Login
1. User provides email and password
2. Credentials are verified against Supabase Auth
3. On success, user's role and verification status are checked
4. User is redirected to appropriate dashboard based on role
5. If verification is pending, user is redirected to verification pending page

### Session Management
1. The app checks for existing session on load
2. AuthContext subscribes to Supabase auth state changes
3. Session is refreshed automatically by Supabase client
4. Session tracking is maintained in the database

### Logout
1. User initiates logout
2. Session is removed from database
3. Supabase auth signOut is called
4. Local storage is cleared
5. User is redirected to login page

## Role-Based Access Control
- **Admin Role**: Full access to all system features
- **User Role**: Limited access to user-specific features
- **Role Storage**: User roles are stored in the user_roles table
- **Role Checking**: The isAdmin property in AuthContext determines access rights

## Verification Process
1. New users start with "pending" verification status
2. Admins review and verify users in the admin profile section
3. Upon verification, users gain access to their respective interfaces
4. Users with "pending" status are restricted to the verification pending page

## Security Features
- JWT-based authentication
- Session persistence options
- Automatic token refresh
- Protection against concurrent session refreshes
- Row Level Security in database tables

## User Profile Data
- Basic user information stored in Supabase Auth
- Extended profile data stored in the profiles table
- Profile data includes verification status, contact information, and preferences

## Technical Implementation Notes
- Session state persisted in localStorage
- Auth state changes handled via Supabase onAuthStateChange event
- Special handling for token refresh events to prevent duplicate processing
- Debounced auth state changes to prevent rapid state updates
