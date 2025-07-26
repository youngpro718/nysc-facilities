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
      try {
        const { data, error } = await supabase
          .from('unified_personnel_view')
          .select('*')
          .order('full_name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching unified personnel:', error);
        throw error;
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
