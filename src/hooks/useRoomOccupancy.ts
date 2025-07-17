import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OccupancyRecord {
  id: string;
  room_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  occupancy_type: 'work' | 'meeting' | 'court_session' | 'maintenance';
  metadata?: any;
}

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
  const queryClient = useQueryClient();

  // Get current occupancy for a specific room
  const { data: currentOccupancy, isLoading } = useQuery<CurrentOccupancy>({
    queryKey: ['room-occupancy', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID required');

      // Get current check-ins (not checked out)
      const { data: occupancyData, error: occupancyError } = await supabase
        .from('room_occupancy')
        .select(`
          user_id,
          checked_in_at,
          occupancy_type,
          metadata,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('room_id', roomId)
        .is('checked_out_at', null);

      if (occupancyError) throw occupancyError;

      // Get room capacity
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('room_type')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Get capacity based on room type
      let capacity = 50; // Default capacity
      if (roomData.room_type === 'courtroom') {
        const { data: courtroomData } = await supabase
          .from('court_rooms')
          .select('juror_capacity, spectator_capacity')
          .eq('room_id', roomId)
          .single();
        
        if (courtroomData) {
          capacity = (courtroomData.juror_capacity || 0) + (courtroomData.spectator_capacity || 0);
        }
      }

      const occupants = occupancyData.map(record => ({
        user_id: record.user_id,
        checked_in_at: record.checked_in_at,
        occupancy_type: record.occupancy_type,
        user_name: record.profiles ? 
          `${record.profiles.first_name} ${record.profiles.last_name}`.trim() : 
          'Unknown User'
      }));

      return {
        room_id: roomId,
        current_count: occupancyData.length,
        capacity,
        occupants
      };
    },
    enabled: !!roomId,
  });

  // Check in to a room
  const checkInMutation = useMutation({
    mutationFn: async ({ 
      roomId, 
      userId, 
      occupancyType = 'work',
      metadata 
    }: { 
      roomId: string; 
      userId: string; 
      occupancyType?: 'work' | 'meeting' | 'court_session' | 'maintenance';
      metadata?: any;
    }) => {
      // Check if user is already checked in to this room
      const { data: existingCheckIn } = await supabase
        .from('room_occupancy')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .is('checked_out_at', null)
        .single();

      if (existingCheckIn) {
        throw new Error('User is already checked into this room');
      }

      const { data, error } = await supabase
        .from('room_occupancy')
        .insert({
          room_id: roomId,
          user_id: userId,
          occupancy_type: occupancyType,
          metadata
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-occupancy'] });
      toast({
        title: "Checked In",
        description: "Successfully checked into the room",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check out of a room
  const checkOutMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('room_occupancy')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .is('checked_out_at', null)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-occupancy'] });
      toast({
        title: "Checked Out",
        description: "Successfully checked out of the room",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    currentOccupancy,
    isLoading,
    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  };
}