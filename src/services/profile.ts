// src/services/profile.ts
// Profile management service with role-based access control
import { supabase } from '@/lib/supabase';

/**
 * User roles in the system
 * - coordinator: Full access (read/write all profiles, assign roles)
 * - sergeant: Limited updates (to be implemented)
 * - it_dcas: Read + targeted updates (to be implemented)
 * - viewer: Read-only (own profile only)
 */
export type Role = 'coordinator' | 'sergeant' | 'it_dcas' | 'viewer';

/**
 * Profile data structure matching the database schema
 */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  building: string | null;
  onboarded: boolean;
  mfa_enforced: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields from existing schema
  username?: string | null;
  avatar_url?: string | null;
  theme?: string | null;
  phone?: string | null;
  department?: string | null;
  title?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  time_zone?: string | null;
  language?: string | null;
  is_approved?: boolean;
  verification_status?: string;
  access_level?: string;
  enabled_modules?: any;
  user_settings?: any;
  is_suspended?: boolean;
  onboarding_completed?: boolean;
}

/**
 * Get the current user's profile
 * @returns The user's profile data
 * @throws Error if not signed in or profile not found
 */
export async function getMyProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return data as Profile;
}

/**
 * Update the current user's profile
 * Note: Users cannot update their own role, mfa_enforced, or onboarded fields
 * Only coordinators can modify these security-related fields
 * 
 * @param patch - Partial profile data to update
 * @returns The updated profile data
 * @throws Error if not signed in or update fails
 */
export async function updateMyProfile(patch: Partial<{
  full_name: string;
  role: Role;
  building: string;
  onboarded: boolean;
  mfa_enforced: boolean;
  // Additional updatable fields
  username: string;
  avatar_url: string;
  theme: string;
  phone: string;
  department: string;
  title: string;
  first_name: string;
  last_name: string;
  bio: string;
  time_zone: string;
  language: string;
}>): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select('*')
    .single();
  
  if (error) throw error;
  return data as Profile;
}

/**
 * Get a profile by user ID (requires coordinator role or own profile)
 * @param userId - The user ID to fetch
 * @returns The profile data
 * @throws Error if not authorized or profile not found
 */
export async function getProfileById(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data as Profile;
}

/**
 * Get all profiles (requires coordinator role)
 * @returns Array of all profiles
 * @throws Error if not authorized
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Profile[];
}

/**
 * Update another user's profile (requires coordinator role)
 * Coordinators can update any field including role, mfa_enforced, and onboarded
 * 
 * @param userId - The user ID to update
 * @param patch - Partial profile data to update
 * @returns The updated profile data
 * @throws Error if not authorized or update fails
 */
export async function updateProfile(
  userId: string, 
  patch: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  
  if (error) throw error;
  return data as Profile;
}

/**
 * Check if the current user has coordinator role
 * @returns True if user is a coordinator
 */
export async function isCoordinator(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_coordinator');
    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error checking coordinator status:', error);
    return false;
  }
}

/**
 * Get profiles by role
 * @param role - The role to filter by
 * @returns Array of profiles with the specified role
 * @throws Error if not authorized
 */
export async function getProfilesByRole(role: Role): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('full_name', { ascending: true });
  
  if (error) throw error;
  return data as Profile[];
}

/**
 * Get profiles by building
 * @param building - The building to filter by
 * @returns Array of profiles assigned to the specified building
 * @throws Error if not authorized
 */
export async function getProfilesByBuilding(building: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('building', building)
    .order('full_name', { ascending: true });
  
  if (error) throw error;
  return data as Profile[];
}

/**
 * Get profiles that need onboarding
 * @returns Array of profiles where onboarded is false
 * @throws Error if not authorized
 */
export async function getProfilesNeedingOnboarding(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('onboarded', false)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Profile[];
}

/**
 * Mark user as onboarded (requires coordinator role)
 * @param userId - The user ID to mark as onboarded
 * @returns The updated profile
 * @throws Error if not authorized or update fails
 */
export async function markUserAsOnboarded(userId: string): Promise<Profile> {
  return updateProfile(userId, { onboarded: true });
}

/**
 * Enforce MFA for a user (requires coordinator role)
 * @param userId - The user ID to enforce MFA for
 * @param enforced - Whether to enforce MFA
 * @returns The updated profile
 * @throws Error if not authorized or update fails
 */
export async function setMfaEnforcement(userId: string, enforced: boolean): Promise<Profile> {
  return updateProfile(userId, { mfa_enforced: enforced });
}

/**
 * Assign a role to a user (requires coordinator role)
 * @param userId - The user ID to assign role to
 * @param role - The role to assign
 * @returns The updated profile
 * @throws Error if not authorized or update fails
 */
export async function assignRole(userId: string, role: Role): Promise<Profile> {
  return updateProfile(userId, { role });
}
