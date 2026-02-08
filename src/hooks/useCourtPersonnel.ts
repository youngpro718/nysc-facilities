import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
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
    // Align with invalidations elsewhere in the app
    queryKey: ["court-personnel"],
    queryFn: async (): Promise<CourtPersonnelData> => {
      // Primary source: personnel_profiles (most complete)
      let allPersonnel: PersonnelOption[] = [];

      try {
        // Use RPC to avoid RLS/PostgREST policy issues
        const { data: personnelData, error: personnelError } = await supabase
          .rpc('list_personnel_profiles_minimal');
        if (personnelError) throw personnelError;

        const rows = (personnelData as unknown[]) || [];
        // Prefer active, but include nulls to avoid dropping everything if the column isn't populated
        const filteredRows = rows.filter((r: Record<string, unknown>) => r.is_active === true || r.is_active === null || typeof r.is_active === 'undefined');

        allPersonnel = filteredRows.map((person: Record<string, unknown>) => ({
          id: person.id,
          name: person.display_name || person.full_name || '',
          role: person.title || person.primary_role || 'Staff',
          // Minimal RPC doesn't include phone/extension/room; leave undefined
          phone: undefined,
          extension: undefined,
          room: undefined,
          floor: undefined,
          department: person.department || undefined,
        }));
      } catch (e) {
        // Swallow and try fallbacks below
        // eslint-disable-next-line no-console
        logger.warn('[useCourtPersonnel] personnel_profiles query failed, will try fallbacks', e);
      }

      // Fallback: personnel_profiles_view (legacy)
      if (allPersonnel.length === 0) {
        try {
          const { data: legacyData, error: legacyError } = await supabase
            .from('personnel_profiles_view')
            .select(`id, display_name, full_name, primary_role, title, department`);
          if (legacyError) throw legacyError;
          const rows = (legacyData as unknown[]) || [];
          allPersonnel = rows.map((r) => ({
            id: r.id,
            name: r.display_name || r.full_name || '',
            role: r.title || r.primary_role || 'Staff',
            department: r.department || undefined,
          }));
        } catch (e) {
          // Final fallback will leave empty arrays
          // eslint-disable-next-line no-console
          logger.warn('[useCourtPersonnel] personnel_profiles_view fallback failed', e);
        }
      }

      // Categorize by role (hardened)
      const norm = (s?: string) => (s || '').toLowerCase();
      // Client-side sort for stable dropdowns without relying on server order
      allPersonnel = (allPersonnel || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      const judges: PersonnelOption[] = allPersonnel.filter(person => {
        const r = norm(person.role);
        return r.includes('judge') || r.includes('justice');
      });

      const clerks: PersonnelOption[] = allPersonnel.filter(person => {
        const r = norm(person.role);
        return r.includes('clerk');
      });

      const sergeants: PersonnelOption[] = allPersonnel.filter(person => {
        const r = norm(person.role);
        return r.includes('sergeant') || r.includes('officer');
      });

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
