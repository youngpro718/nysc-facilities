import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PersonnelOption {
  id: string;
  name: string;
  role: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
}

export interface CourtPersonnelData {
  judges: PersonnelOption[];
  clerks: PersonnelOption[];
  sergeants: PersonnelOption[];
  allPersonnel: PersonnelOption[];
}

export const useCourtPersonnel = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["court-personnel-v2"],
    queryFn: async (): Promise<CourtPersonnelData> => {
      // Fetch court personnel directly from personnel_profiles table with type assertion
      const { data: personnelData, error: personnelError } = await (supabase as any)
        .from('personnel_profiles')
        .select(`
          id,
          full_name,
          display_name,
          primary_role,
          title,
          phone,
          extension,
          room_number,
          floor,
          department,
          is_active
        `)
        .eq('is_active', true)
        .order('full_name');
      
      if (personnelError) throw personnelError;

      // Convert personnel_profiles to PersonnelOption format
      const allPersonnel = (personnelData || []).map((person: any) => ({
        id: person.id,
        name: person.display_name || person.full_name || '',
        role: person.title || person.primary_role || 'Staff',
        phone: person.phone || '',
        extension: person.extension || '',
        room: person.room_number || '',
        floor: person.floor || '',
        department: person.department || ''
      }));

      // Categorize by role
      const judges: PersonnelOption[] = allPersonnel.filter(person => 
        person.role.toLowerCase().includes('judge') || 
        person.role.toLowerCase().includes('justice')
      );

      const clerks: PersonnelOption[] = allPersonnel.filter(person => 
        person.role.toLowerCase().includes('clerk')
      );

      const sergeants: PersonnelOption[] = allPersonnel.filter(person => 
        person.role.toLowerCase().includes('sergeant') ||
        person.role.toLowerCase().includes('officer')
      );

      return {
        judges,
        clerks,
        sergeants,
        allPersonnel,
      };
    },
  });

  return {
    personnel: data || { judges: [], clerks: [], sergeants: [], allPersonnel: [] },
    isLoading,
    error,
    refetch,
  };
};
