import { useQuery } from '@tanstack/react-query';
import {
  listKeyRequestsForUser,
  type KeyRequestRecord as KeyRequest,
} from '@features/keys/services/keyRequestService';
export type { KeyRequest };

export function useKeyRequests(userId?: string) {
  return useQuery<KeyRequest[]>({
    queryKey: ['key-requests', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: () => listKeyRequestsForUser(userId!),
  });
}
