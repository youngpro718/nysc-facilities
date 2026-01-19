import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PersonnelAccessRecord {
  id: string;
  source_type: 'profile' | 'personnel_profile';
  name: string;
  email: string | null;
  department: string | null;
  title: string | null;
  avatar_url: string | null;
  user_role: string | null;
  is_registered_user: boolean;
  room_count: number;
  key_count: number;
}

export interface PersonnelAccessStats {
  total: number;
  registeredUsers: number;
  courtPersonnel: number;
  withRoomAccess: number;
  withKeyAccess: number;
}

export function usePersonnelAccess() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['personnel-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel_access_view')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as PersonnelAccessRecord[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const personnel = data || [];

  const stats: PersonnelAccessStats = {
    total: personnel.length,
    registeredUsers: personnel.filter(p => p.is_registered_user).length,
    courtPersonnel: personnel.filter(p => !p.is_registered_user).length,
    withRoomAccess: personnel.filter(p => p.room_count > 0).length,
    withKeyAccess: personnel.filter(p => p.key_count > 0).length,
  };

  const registeredUsers = personnel.filter(p => p.is_registered_user);
  const courtPersonnel = personnel.filter(p => !p.is_registered_user);

  const searchPersonnel = (query: string) => {
    if (!query.trim()) return personnel;
    const lowerQuery = query.toLowerCase();
    return personnel.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery) ||
      p.email?.toLowerCase().includes(lowerQuery) ||
      p.department?.toLowerCase().includes(lowerQuery) ||
      p.title?.toLowerCase().includes(lowerQuery)
    );
  };

  const getPersonnelById = (id: string) => {
    return personnel.find(p => p.id === id);
  };

  return {
    personnel,
    registeredUsers,
    courtPersonnel,
    stats,
    isLoading,
    error,
    refetch,
    searchPersonnel,
    getPersonnelById,
  };
}
