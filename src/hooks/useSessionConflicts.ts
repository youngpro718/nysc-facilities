import { useQuery } from '@tanstack/react-query';
import { ConflictDetectionService } from '@/services/court/conflictDetectionService';
import { format } from 'date-fns';

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
    staleTime: 30000, // 30 seconds
  });
}
