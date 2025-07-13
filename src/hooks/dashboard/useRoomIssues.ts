import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserIssue } from "@/types/dashboard";

interface RoomIssue extends UserIssue {
  is_created_by_user: boolean;
  room_id: string;
}

interface UseRoomIssuesProps {
  roomIds?: string[];
  userId?: string;
  enabled?: boolean;
}

export const useRoomIssues = ({ roomIds, userId, enabled = true }: UseRoomIssuesProps) => {
  const { data: roomIssues = [], isLoading, error } = useQuery<RoomIssue[]>({
    queryKey: ['roomIssues', roomIds, userId],
    queryFn: async () => {
      if (!roomIds || roomIds.length === 0) {
        return [];
      }

      console.log('Fetching issues for rooms:', roomIds);

      try {
        const { data: issues, error: issuesError } = await supabase
          .from('issues')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            type,
            created_at,
            updated_at,
            building_id,
            room_id,
            seen,
            photos,
            created_by,
            rooms!inner(
              id,
              name,
              room_number
            ),
            buildings(
              name
            ),
            floors(
              name
            )
          `)
          .in('room_id', roomIds)
          .order('created_at', { ascending: false });

        if (issuesError) {
          console.error('Error fetching room issues:', issuesError);
          throw issuesError;
        }

        // Format the issues for display
        const formattedIssues = issues?.map(issue => ({
          id: issue.id,
          title: issue.title,
          description: issue.description,
          status: issue.status as "open" | "in_progress" | "resolved",
          priority: issue.priority as "low" | "medium" | "high",
          created_at: issue.created_at,
          building_id: issue.building_id,
          room_id: issue.room_id,
          seen: issue.seen,
          photos: issue.photos || [],
          rooms: issue.rooms,
          buildings: issue.buildings,
          floors: issue.floors,
          is_created_by_user: issue.created_by === userId
        })) || [];

        console.log('Formatted room issues:', formattedIssues);
        return formattedIssues;
      } catch (error) {
        console.error('Error in room issues query:', error);
        throw error;
      }
    },
    enabled: enabled && !!roomIds && roomIds.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Separate issues by status
  const openIssues = roomIssues.filter(issue => issue.status === 'open');
  const inProgressIssues = roomIssues.filter(issue => issue.status === 'in_progress');
  const resolvedIssues = roomIssues.filter(issue => issue.status === 'resolved');

  // Separate by who created them
  const myIssues = roomIssues.filter(issue => issue.is_created_by_user);
  const otherIssues = roomIssues.filter(issue => !issue.is_created_by_user);

  // Group by room
  const issuesByRoom = roomIssues.reduce((acc, issue) => {
    const roomId = issue.room_id;
    if (!acc[roomId]) {
      acc[roomId] = [];
    }
    acc[roomId].push(issue);
    return acc;
  }, {} as Record<string, RoomIssue[]>);

  return {
    roomIssues,
    openIssues,
    inProgressIssues,
    resolvedIssues,
    myIssues,
    otherIssues,
    issuesByRoom,
    isLoading,
    error,
    totalIssues: roomIssues.length
  };
};