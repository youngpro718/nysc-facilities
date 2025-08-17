// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedPersonnelFromView {
  personnel_type: 'registered_user' | 'court_personnel';
  unified_id: string;
  source_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  title: string;
  status: string;
  access_level?: string;
  room?: string;
  extension?: string;
  floor?: string;
  created_at: string;
  updated_at?: string;
}

export interface PersonnelStats {
  total: number;
  registeredUsers: number;
  courtPersonnel: number;
}

export const useUnifiedPersonnelView = () => {
  const {
    data: personnel = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-personnel-view'],
    queryFn: async (): Promise<UnifiedPersonnelFromView[]> => {
      // helper fallback to personnel_profiles
      const fetchFromPersonnelProfiles = async (): Promise<UnifiedPersonnelFromView[]> => {
        const { data: personnelData, error: personnelError } = await (supabase as any)
          .from('personnel_profiles')
          .select(`
            id,
            full_name,
            display_name,
            first_name,
            last_name,
            email,
            department,
            primary_role,
            title,
            phone,
            extension,
            room_number,
            floor,
            created_at,
            updated_at,
            is_active
          `)
          .eq('is_active', true)
          .order('full_name');

        if (personnelError) throw personnelError;

        return (personnelData || []).map((p: any) => {
          const nameSource = p.display_name || p.full_name || '';
          let first = p.first_name || '';
          let last = p.last_name || '';
          if (!first && !last && nameSource) {
            const parts = String(nameSource).trim().split(/\s+/);
            if (parts.length === 1) {
              first = parts[0];
            } else {
              last = parts.pop() || '';
              first = parts.join(' ');
            }
          }

          return {
            personnel_type: 'court_personnel',
            unified_id: `court_${p.id}`,
            source_id: String(p.id),
            first_name: first,
            last_name: last,
            full_name: nameSource,
            email: p.email || '',
            phone: p.phone || '',
            department: p.department || '',
            role: p.primary_role || p.title || '',
            title: p.title || p.primary_role || '',
            status: p.is_active ? 'active' : 'inactive',
            access_level: undefined,
            room: p.room_number || '',
            extension: p.extension || '',
            floor: p.floor || '',
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || undefined,
          } as UnifiedPersonnelFromView;
        });
      };

      try {
        const { data, error } = await supabase
          .from('unified_personnel_view')
          .select('*')
          .order('full_name');

        // If the view errors (e.g., RLS or missing), fall back
        if (error) {
          console.warn('[useUnifiedPersonnelView] unified_personnel_view error; falling back to personnel_profiles', error);
          return await fetchFromPersonnelProfiles();
        }

        // If unified view returns rows, use it; else fall back
        if (data && data.length > 0) return data;

        console.warn('[useUnifiedPersonnelView] unified_personnel_view returned no rows; falling back to personnel_profiles');
        return await fetchFromPersonnelProfiles();
      } catch (error) {
        console.error('Error fetching unified personnel, final fallback attempt...', error);
        // Last-chance attempt to fetch directly if the error was thrown before fallback
        try {
          return await fetchFromPersonnelProfiles();
        } catch (fallbackError) {
          console.error('Fallback fetch from personnel_profiles also failed:', fallbackError);
          throw fallbackError;
        }
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Calculate statistics
  const stats: PersonnelStats = {
    total: personnel.length,
    registeredUsers: personnel.filter(p => p.personnel_type === 'registered_user').length,
    courtPersonnel: personnel.filter(p => p.personnel_type === 'court_personnel').length
  };

  // Utility functions for filtering
  const getPersonnelByType = (type: 'registered_user' | 'court_personnel' | 'all' = 'all') => {
    if (type === 'all') return personnel;
    return personnel.filter(p => p.personnel_type === type);
  };

  const searchPersonnel = (query: string) => {
    if (!query.trim()) return personnel;
    
    const searchTerm = query.toLowerCase();
    return personnel.filter(person => 
      person.full_name?.toLowerCase().includes(searchTerm) ||
      person.first_name?.toLowerCase().includes(searchTerm) ||
      person.last_name?.toLowerCase().includes(searchTerm) ||
      person.email?.toLowerCase().includes(searchTerm) ||
      person.department?.toLowerCase().includes(searchTerm) ||
      person.role?.toLowerCase().includes(searchTerm) ||
      person.title?.toLowerCase().includes(searchTerm)
    );
  };

  const getPersonnelById = (id: string) => {
    return personnel.find(p => p.source_id === id || p.unified_id === id);
  };

  return {
    personnel,
    stats,
    isLoading,
    error,
    refetch,
    // Utility functions
    getPersonnelByType,
    searchPersonnel,
    getPersonnelById,
    // Convenience getters
    registeredUsers: personnel.filter(p => p.personnel_type === 'registered_user'),
    courtPersonnel: personnel.filter(p => p.personnel_type === 'court_personnel')
  };
};

export default useUnifiedPersonnelView;
