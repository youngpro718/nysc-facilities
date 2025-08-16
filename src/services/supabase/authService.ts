
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
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
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

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from signup');
    }

    return data;
  } catch (error: any) {
    throw error;
  }
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
  console.log('🔍 fetchUserProfile - Starting for userId:', userId);
  
  // Get current session to debug auth context
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('🔍 fetchUserProfile - Current session:', session?.user?.id, 'Error:', sessionError);
  
  // First try to get the role directly to check if RLS is blocking it
  const roleResponse = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle() as any;
    
  console.log('🔍 fetchUserProfile - Role response:', {
    data: roleResponse.data,
    error: roleResponse.error,
    status: roleResponse.status,
    statusText: roleResponse.statusText
  });
  
  if (roleResponse.error) {
    console.error('❌ fetchUserProfile - Role query error:', roleResponse.error);
    // If RLS is blocking, try using the secure function
    console.log('🔍 fetchUserProfile - Trying secure function for role check...');
    try {
      const { data: secureRoleData, error: secureError } = await supabase.rpc('get_current_user_role');
      console.log('🔍 fetchUserProfile - Secure role response:', { data: secureRoleData, error: secureError });
      if (!secureError && secureRoleData) {
        (roleResponse as any).data = { role: secureRoleData };
        (roleResponse as any).error = null;
      }
    } catch (secureRoleError) {
      console.error('❌ fetchUserProfile - Secure role function error:', secureRoleError);
    }
  }
  
  const [profileResponse, roomAssignmentsResponse] = await Promise.all([
    supabase.from('profiles').select(`
      *,
      departments(name)
    `).eq('id', userId).single(),
    supabase.from('occupant_room_assignments').select(`
      room_id,
      rooms!occupant_room_assignments_room_id_fkey(room_number)
    `).eq('occupant_id', userId)
  ]);
  
  console.log('🔍 fetchUserProfile - Profile response:', {
    data: profileResponse.data ? 'Profile exists' : 'No profile',
    error: profileResponse.error,
    status: profileResponse.status
  });
  
  if (profileResponse.error) {
    console.error('❌ fetchUserProfile - Profile query error:', profileResponse.error);
    throw profileResponse.error;
  }
  
  const profile = profileResponse.data;
  const departmentName = profile?.departments?.name;
  const roomAssignments = roomAssignmentsResponse.data || [];
  const userRole = roleResponse.data?.role;
  
  console.log('🔍 fetchUserProfile - Final results:');
  console.log('  - userId:', userId);
  console.log('  - userRole:', userRole);
  console.log('  - isAdmin:', userRole === 'admin');
  console.log('  - profile exists:', !!profile);
  console.log('  - profile.access_level:', profile?.access_level);
  console.log('  - departmentName:', departmentName);
  
  // Additional debugging: Test direct role query
  try {
    const directRoleTest = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    console.log('🔍 fetchUserProfile - Direct role test:', directRoleTest);
  } catch (error) {
    console.error('❌ fetchUserProfile - Direct role test failed:', error);
  }
  
  const result = {
    isAdmin: userRole === 'admin',
    role: userRole,
    profile: {
      ...profile,
      department: departmentName,
      roomAssignments: roomAssignments
    } as UserProfile & { department?: string; roomAssignments?: any[]; role?: string }
  };
  
  console.log('🎯 fetchUserProfile - Returning:', {
    isAdmin: result.isAdmin,
    role: result.role,
    profileId: result.profile?.id
  });
  
  return result;
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
