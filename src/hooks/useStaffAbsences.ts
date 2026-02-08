import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface StaffAbsence {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_role: string;
  absence_reason: string;
  starts_on: string;
  ends_on: string;
  notes: string | null;
}

/**
 * Hook to fetch staff absences for a specific date
 */
export function useStaffAbsencesForDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['staff-absences', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_absences')
        .select(`
          id,
          staff_id,
          absence_reason,
          starts_on,
          ends_on,
          notes,
          staff:staff_id (
            display_name,
            role
          )
        `)
        .lte('starts_on', dateStr)
        .gte('ends_on', dateStr);

      if (error) {
        logger.error('Error fetching staff absences:', error);
        throw error;
      }

      // Map to a cleaner format
      const absences: StaffAbsence[] = (data || []).map((absence: Record<string, unknown>) => ({
        id: absence.id,
        staff_id: absence.staff_id,
        staff_name: absence.staff?.display_name || 'Unknown',
        staff_role: absence.staff?.role || 'unknown',
        absence_reason: absence.absence_reason,
        starts_on: absence.starts_on,
        ends_on: absence.ends_on,
        notes: absence.notes,
      }));

      return absences;
    },
  });
}

/**
 * Check if a specific staff member is absent on a given date
 */
export function useIsStaffAbsent(staffName: string, date: Date) {
  const { data: absences } = useStaffAbsencesForDate(date);

  const absence = absences?.find(
    (a) => a.staff_name.toLowerCase() === staffName.toLowerCase()
  );

  return {
    isAbsent: !!absence,
    absence: absence,
  };
}

/**
 * Get all absent staff names for a specific date (for quick lookup)
 */
export function useAbsentStaffNames(date: Date) {
  const { data: absences, isLoading } = useStaffAbsencesForDate(date);

  const absentStaffMap = new Map<string, StaffAbsence>();
  
  absences?.forEach((absence) => {
    absentStaffMap.set(absence.staff_name.toLowerCase(), absence);
  });

  return {
    absentStaffMap,
    isLoading,
    absences: absences || [],
  };
}
