import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UserPersonnelInfo {
  personnelId: string | null;
  role: 'justice' | 'clerk' | 'sergeant' | null;
  displayName: string | null;
  title: string | null;
  roomNumber: string | null;
  phone: string | null;
  extension: string | null;
}

/**
 * Hook to get the current user's personnel information and court role
 * This is used to highlight their assignment in the term view
 */
export function useUserPersonnelInfo(userId?: string) {
  return useQuery<UserPersonnelInfo>({
    queryKey: ['user-personnel-info', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          personnelId: null,
          role: null,
          displayName: null,
          title: null,
          roomNumber: null,
          phone: null,
          extension: null,
        };
      }

      // First, get the user's profile to find their personnel_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, personnel_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.personnel_id) {
        return {
          personnelId: null,
          role: null,
          displayName: profile ? `${profile.first_name} ${profile.last_name}` : null,
          title: null,
          roomNumber: null,
          phone: null,
          extension: null,
        };
      }

      // Get the personnel details
      const { data: personnel, error: personnelError } = await supabase
        .from('personnel_profiles')
        .select('id, display_name, title, primary_role, room_number, phone, extension')
        .eq('id', profile.personnel_id)
        .single();

      if (personnelError || !personnel) {
        return {
          personnelId: profile.personnel_id,
          role: null,
          displayName: `${profile.first_name} ${profile.last_name}`,
          title: null,
          roomNumber: null,
          phone: null,
          extension: null,
        };
      }

      // Determine the court role based on primary_role or title
      let role: 'justice' | 'clerk' | 'sergeant' | null = null;
      const roleStr = (personnel.primary_role || personnel.title || '').toLowerCase();
      
      if (roleStr.includes('justice') || roleStr.includes('judge')) {
        role = 'justice';
      } else if (roleStr.includes('clerk')) {
        role = 'clerk';
      } else if (roleStr.includes('sergeant') || roleStr.includes('officer')) {
        role = 'sergeant';
      }

      return {
        personnelId: personnel.id,
        role,
        displayName: personnel.display_name,
        title: personnel.title,
        roomNumber: personnel.room_number,
        phone: personnel.phone,
        extension: personnel.extension,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
