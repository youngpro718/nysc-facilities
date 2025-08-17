import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedPersonnel {
  id: string;
  unified_id: string;
  personnel_type: 'occupant' | 'court_personnel';
  source_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  title?: string;
  status: string;
  access_level?: string;
  room?: string;
  extension?: string;
  floor?: string;
  created_at: string;
  updated_at?: string;
  // Additional occupant-specific fields
  hire_date?: string;
  start_date?: string;
  end_date?: string;
  employment_type?: string;
  supervisor_id?: string;
}

export interface PersonnelStats {
  total: number;
  occupants: number;
  courtPersonnel: number;
  active: number;
  inactive: number;
}

export const useUnifiedPersonnel = () => {
  const {
    data: personnel = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-personnel'],
    queryFn: async (): Promise<UnifiedPersonnel[]> => {
      const allPersonnel: UnifiedPersonnel[] = [];

      try {
        // 1. Fetch occupants
        const { data: occupants, error: occupantsError } = await supabase
          .from('occupants')
          .select('*')
          .neq('status', 'terminated'); // Only active occupants

        if (occupantsError) throw occupantsError;

        // Add occupants to unified list
        occupants?.forEach(occupant => {
          // Ensure required fields exist
          if (!occupant?.first_name && !occupant?.last_name) return;
          
          const fullName = `${occupant.first_name || ''} ${occupant.last_name || ''}`.trim();
          allPersonnel.push({
            id: `occupant_${occupant.id}`,
            unified_id: `occupant_${occupant.id}`,
            personnel_type: 'occupant',
            source_id: occupant.id,
            first_name: occupant.first_name,
            last_name: occupant.last_name,
            full_name: fullName,
            display_name: fullName,
            email: occupant.email || undefined,
            phone: occupant.phone || undefined,
            department: occupant.department || undefined,
            role: occupant.title || undefined,
            title: occupant.title || undefined,
            status: occupant.status || 'active',
            access_level: occupant.access_level || undefined,
            room: occupant.room_id || undefined,
            extension: undefined,
            floor: undefined,
            created_at: occupant.created_at || new Date().toISOString(),
            updated_at: occupant.updated_at || undefined,
            hire_date: occupant.hire_date || undefined,
            start_date: occupant.start_date || undefined,
            end_date: occupant.end_date || undefined,
            employment_type: occupant.employment_type || undefined,
            supervisor_id: occupant.supervisor_id || undefined
          });
        });

        // 2. Fetch court personnel
        const { data: courtPersonnel, error: courtError } = await supabase
          .from('term_personnel')
          .select('*');

        if (courtError) throw courtError;

        // Add court personnel to unified list
        courtPersonnel?.forEach(person => {
          // Ensure person.name exists before processing
          if (!person?.name) return;
          
          // Parse first and last name from single name field
          const nameParts = person.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Check if this person already exists as an occupant (avoid duplicates)
          const existingPerson = allPersonnel.find(p => 
            p.full_name?.toLowerCase() === person.name?.toLowerCase() ||
            (p.first_name?.toLowerCase() === firstName?.toLowerCase() && 
             p.last_name?.toLowerCase() === lastName?.toLowerCase())
          );

          if (!existingPerson) {
            allPersonnel.push({
              id: `court_${person.id}`,
              unified_id: `court_${person.id}`,
              personnel_type: 'court_personnel',
              source_id: person.id,
              first_name: firstName,
              last_name: lastName,
              full_name: person.name,
              display_name: person.name,
              email: undefined, // court personnel don't have email in term_personnel table
              phone: person.phone || undefined,
              department: 'Court Administration',
              role: person.role,
              title: person.role,
              status: 'active',
              access_level: undefined,
              room: person.room || undefined,
              extension: person.extension || undefined,
              floor: person.floor || undefined,
              created_at: person.created_at || new Date().toISOString(),
              updated_at: person.updated_at || undefined
            });
          }
        });

        // Sort by full name for consistent ordering
        return allPersonnel.sort((a, b) => a.full_name.localeCompare(b.full_name));

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
    occupants: personnel.filter(p => p.personnel_type === 'occupant').length,
    courtPersonnel: personnel.filter(p => p.personnel_type === 'court_personnel').length,
    active: personnel.filter(p => p.status === 'active').length,
    inactive: personnel.filter(p => p.status !== 'active').length
  };

  // Utility functions for filtering
  const getPersonnelByType = (type: 'occupant' | 'court_personnel' | 'all' = 'all') => {
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
    return personnel.find(p => p.id === id || p.unified_id === id);
  };

  // Get people without an email (useful for selecting court personnel who need accounts)
  const getPersonnelWithoutEmail = (
    type: 'all' | 'court_personnel' | 'occupant' = 'all'
  ) => {
    const list = type === 'all' ? personnel : personnel.filter(p => p.personnel_type === type);
    return list.filter(p => !p.email);
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
    getPersonnelWithoutEmail,
    // Convenience getters
    occupants: personnel.filter(p => p.personnel_type === 'occupant'),
    courtPersonnel: personnel.filter(p => p.personnel_type === 'court_personnel'),
    activePersonnel: personnel.filter(p => p.status === 'active'),
    // Convenience lists for UI
    personnelWithoutEmail: personnel.filter(p => !p.email),
    courtPersonnelWithoutEmail: personnel.filter(
      p => p.personnel_type === 'court_personnel' && !p.email
    ),
  };
};

export default useUnifiedPersonnel;
