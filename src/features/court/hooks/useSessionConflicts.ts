import { useQuery } from '@tanstack/react-query';
import { ConflictDetectionService } from '@features/court/services/conflictDetectionService';
import { format } from 'date-fns';
import { QUERY_CONFIG } from '@/config';

export function useSessionConflicts(date: Date, period: string, buildingCode: string) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['session-conflicts', dateStr, period, buildingCode],
    queryFn: async () => {
      return await ConflictDetectionService.detectDailySessionIssues(
        dateStr,
        period,
        buildingCode
      );
    },
    staleTime: QUERY_CONFIG.stale.realtime, // 30 seconds
  });
}
