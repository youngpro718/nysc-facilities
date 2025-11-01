import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CurrentOccupancy {
  room_id: string;
  current_count: number;
  capacity: number;
  occupants: Array<{
    user_id: string;
    checked_in_at: string;
    occupancy_type: string;
    user_name?: string;
  }>;
}

export function useRoomOccupancy(roomId?: string) {
  const { toast } = useToast();

  // Get current occupancy for a specific room
  const { data: currentOccupancy, isLoading } = useQuery<CurrentOccupancy>({
    queryKey: ['room-occupancy', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID required');

      // For now, return mock data until the database types are updated
      // TODO: Replace with actual Supabase query once types are regenerated
      const mockOccupancy: CurrentOccupancy = {
        room_id: roomId,
        current_count: 0,
        capacity: 50,
        occupants: []
      };

      return mockOccupancy;
    },
    enabled: !!roomId,
  });

  // Placeholder functions for future implementation
  const checkIn = (params: { roomId: string; userId: string; occupancyType?: string; metadata?: any }) => {
    toast({
      title: "Coming Soon",
      description: "Check-in functionality will be available after database types are updated",
      variant: "destructive",
    });
  };

  const checkOut = (params: { roomId: string; userId: string }) => {
    toast({
      title: "Coming Soon", 
      description: "Check-out functionality will be available after database types are updated",
      variant: "destructive",
    });
  };

  return {
    currentOccupancy,
    isLoading,
    checkIn,
    checkOut,
    isCheckingIn: false,
    isCheckingOut: false,
  };
}