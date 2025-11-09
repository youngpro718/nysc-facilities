/**
 * Role Management Service
 * 
 * Handles all role-related operations using the user_roles table
 * This is the correct way to manage user roles after the migration
 * 
 * @module services/profile/roleManagement
 */

import { supabase } from '@/lib/supabase';
import type { Profile } from '../profile';

export type UserRole = 'administrator' | 'manager' | 'facilities_staff' | 'staff' | 'user' | 'coordinator' | 'sergeant' | 'it_dcas' | 'viewer';

/**
 * Profile data with role information from user_roles table
 */
export interface ProfileWithRole extends Profile {
  role: UserRole | null;
}

/**
 * Get a user's profile with their role from user_roles table
 * @param userId - The user ID to fetch
 * @returns Profile with role information
 */
export async function getProfileWithRole(userId: string): Promise<ProfileWithRole> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError) throw profileError;
  
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (roleError) throw roleError;
  
  return {
    ...profile,
    role: roleData?.role || null
  } as ProfileWithRole;
}

/**
 * Get all users with a specific role
 * @param role - The role to filter by
 * @returns Array of profiles with the specified role
 */
export async function getUsersByRole(role: UserRole): Promise<ProfileWithRole[]> {
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', role);
  
  if (roleError) throw roleError;
  
  const userIds = roleData.map(r => r.user_id);
  if (userIds.length === 0) return [];
  
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)
    .order('full_name', { ascending: true });
  
  if (profileError) throw profileError;
  
  return profiles.map(profile => ({
    ...profile,
    role
  })) as ProfileWithRole[];
}

/**
 * Update a user's role in the user_roles table
 * @param userId - The user ID to update
 * @param role - The new role to assign
 * @param assignedBy - Optional ID of the user making the assignment
 * @returns Success status
 */
export async function updateUserRole(
  userId: string, 
  role: UserRole,
  assignedBy?: string
): Promise<void> {
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (existingRole) {
    // Update existing role
    const { error } = await supabase
      .from('user_roles')
      .update({
        role,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  } else {
    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
      });
    
    if (error) throw error;
  }
}

/**
 * Remove a user's role from the user_roles table
 * @param userId - The user ID to remove role from
 */
export async function removeUserRole(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
}

/**
 * Get a user's current role
 * @param userId - The user ID to check
 * @returns The user's role or null if no role assigned
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data?.role || null;
}

/**
 * Check if a user has a specific role
 * @param userId - The user ID to check
 * @param role - The role to check for
 * @returns True if user has the role
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();
  
  if (error) throw error;
  return data !== null;
}

/**
 * Get all users with their roles
 * @returns Array of profiles with role information
 */
export async function getAllUsersWithRoles(): Promise<ProfileWithRole[]> {
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (profileError) throw profileError;
  
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role');
  
  if (roleError) throw roleError;
  
  const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
  
  return profiles.map(profile => ({
    ...profile,
    role: roleMap.get(profile.id) || null
  })) as ProfileWithRole[];
}
