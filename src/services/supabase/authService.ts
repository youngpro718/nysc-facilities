
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile, UserSignupData } from '@/types/auth';

/**
 * Fetches the current user's session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign up with email, password and user data
 */
export async function signUpWithEmail(email: string, password: string, userData: UserSignupData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        title: userData.title || null,
        phone: userData.phone || null,
        department_id: userData.department_id || null,
        court_position: userData.court_position || null,
        emergency_contact: userData.emergency_contact || null,
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
}

/**
 * Fetch user profile data
 */
export async function fetchUserProfile(userId: string) {
  const [roleResponse, profileResponse, roomAssignmentsResponse] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select(`
      *,
      departments(name)
    `).eq('id', userId).single(),
    supabase.from('occupant_room_assignments').select(`
      room_id,
      rooms(room_number)
    `).eq('occupant_id', userId)
  ]);
  
  if (roleResponse.error) throw roleResponse.error;
  if (profileResponse.error) throw profileResponse.error;
  
  const profile = profileResponse.data;
  const departmentName = profile?.departments?.name;
  const roomAssignments = roomAssignmentsResponse.data || [];
  
  return {
    isAdmin: roleResponse.data?.role === 'admin',
    profile: {
      ...profile,
      department: departmentName,
      roomAssignments: roomAssignments
    } as UserProfile & { department?: string; roomAssignments?: any[] }
  };
}

/**
 * Update user session tracking
 */
export async function updateSessionTracking(userId: string, deviceInfo: any) {
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingSession?.id) {
    await supabase
      .from('user_sessions')
      .update({
        last_active_at: new Date().toISOString(),
        device_info: deviceInfo
      })
      .eq('id', existingSession.id);
  } else {
    await supabase
      .from('user_sessions')
      .insert([{
        user_id: userId,
        device_info: deviceInfo,
        last_active_at: new Date().toISOString()
      }]);
  }
}

/**
 * Delete user session
 */
export async function deleteUserSession(userId: string) {
  const { data } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('id', data.id);
  }
}
