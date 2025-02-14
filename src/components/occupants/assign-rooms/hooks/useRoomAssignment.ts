
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoomDetails {
  id: string;
  name: string;
  room_number: string;
  capacity: number | null;
  current_occupancy: number;
  floors: {
    name: string;
    buildings: {
      name: string;
    };
  } | null;
}

export interface CurrentOccupant {
  id: string;
  first_name: string;
  last_name: string;
}

export function useRoomAssignment(selectedOccupants: string[]) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<'primary_office' | 'work_location' | 'support_space'>('work_location');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [schedule, setSchedule] = useState<{ days: string[]; hours: string | null }>({
    days: [],
    hours: null
  });
  const [notes, setNotes] = useState<string>("");

  const { data: availableRooms, isLoading: isLoadingRooms, refetch: refetchRooms } = useQuery({
    queryKey: ["available-rooms"],
    queryFn: async () => {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('occupant_room_assignments')
        .select('room_id');

      if (assignmentsError) throw assignmentsError;

      const occupancyCounts = (assignmentsData || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.room_id] = (acc[curr.room_id] || 0) + 1;
        return acc;
      }, {});

      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          capacity,
          floors(
            name,
            buildings(name)
          )
        `)
        .eq("status", "active")
        .order("name");

      if (roomsError) throw roomsError;

      return (roomsData || []).map(room => ({
        ...room,
        current_occupancy: occupancyCounts[room.id] || 0
      })) as RoomDetails[];
    },
  });

  const { data: currentOccupants, refetch: refetchOccupants } = useQuery({
    queryKey: ["room-occupants", selectedRoom],
    enabled: !!selectedRoom,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          occupants (
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", selectedRoom);

      if (error) throw error;
      return data?.map(d => d.occupants) as CurrentOccupant[];
    }
  });

  const handleAssign = async (onSuccess: () => void) => {
    if (!selectedRoom) {
      toast.error("Please select a room to assign");
      return;
    }

    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    const selectedRoomDetails = availableRooms?.find(r => r.id === selectedRoom);
    
    if (selectedRoomDetails?.capacity && 
        selectedRoomDetails.current_occupancy + selectedOccupants.length > selectedRoomDetails.capacity) {
      toast.error("This assignment would exceed the room's capacity");
      return;
    }

    try {
      setIsAssigning(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: batchData, error: batchError } = await supabase.rpc('create_assignment_batch', {
        creator_id: user.id,
        batch_metadata: {
          occupant_count: selectedOccupants.length,
          room_id: selectedRoom
        }
      });

      if (batchError) throw batchError;
      if (!batchData) throw new Error("Failed to create batch");

      const assignments = selectedOccupants.map((occupantId) => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assigned_at: new Date().toISOString(),
        start_date: startDate.toISOString(),
        end_date: endDate?.toISOString() || null,
        batch_id: batchData,
        assignment_type: assignmentType,
        is_primary: isPrimary,
        schedule,
        notes
      }));

      const { error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast.success("Room assignments submitted for approval");
      onSuccess();
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    selectedRoom,
    setSelectedRoom,
    assignmentType,
    setAssignmentType,
    isPrimary,
    setIsPrimary,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    schedule,
    setSchedule,
    notes,
    setNotes,
    isAssigning,
    availableRooms,
    isLoadingRooms,
    currentOccupants,
    handleAssign
  };
}
