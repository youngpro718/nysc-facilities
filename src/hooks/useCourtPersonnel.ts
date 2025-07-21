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
    queryKey: ["court-personnel"],
    queryFn: async (): Promise<CourtPersonnelData> => {
      // Fetch personnel from the profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          department,
          title
        `)
        .order('last_name');
      
      if (profilesError) throw profilesError;

      // Convert profiles to PersonnelOption format
      const allProfiles = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        role: profile.title || 'Staff',
        phone: profile.phone || '',
        extension: '',
        room: '',
        floor: '',
        department: profile.department || '',
        email: profile.email || '',
        fax: ''
      }));

      // Categorize by role
      const judges: PersonnelOption[] = allProfiles.filter(person => 
        person.role.toLowerCase().includes('judge') || 
        person.role.toLowerCase().includes('justice')
      );

      const clerks: PersonnelOption[] = allProfiles.filter(person => 
        person.role.toLowerCase().includes('clerk')
      );

      const sergeants: PersonnelOption[] = allProfiles.filter(person => 
        person.role.toLowerCase().includes('sergeant') ||
        person.role.toLowerCase().includes('officer')
      );

      const allPersonnel = allProfiles;

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
