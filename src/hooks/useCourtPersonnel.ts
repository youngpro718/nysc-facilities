import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PersonnelOption {
  id: string;
  name: string;
  role: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
  department?: string;
}

type PersonnelProfileRow = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  primary_role: string | null;
  title: string | null;
  phone: string | null;
  extension: string | null;
  room_number: string | null;
  floor: string | null;
  department: string | null;
  is_active: boolean | null;
};

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
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel_profiles')
        .select(
          `id, full_name, display_name, primary_role, title, phone, extension, room_number, floor, department, is_active`
        )
        .eq('is_active', true)
        .order('full_name');
      
      if (personnelError) throw personnelError;

      // Convert personnel_profiles to PersonnelOption format
      const allPersonnel = ((personnelData as PersonnelProfileRow[]) || []).map((person) => ({
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
