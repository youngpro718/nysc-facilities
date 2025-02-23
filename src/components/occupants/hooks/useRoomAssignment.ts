
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRoomAssignment(onSuccess: () => void) {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignRoom = async (
    selectedRoom: string,
    selectedOccupants: string[],
    isPrimaryAssignment: boolean
  ) => {
    if (!selectedRoom) {
      toast.error("Please select a room to assign");
      return;
    }

    try {
      setIsAssigning(true);

      const assignments = selectedOccupants.map((occupantId) => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assigned_at: new Date().toISOString(),
        is_primary: isPrimaryAssignment
      }));

      console.log('Creating room assignments:', assignments);

      const { data, error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments)
        .select();

      if (assignmentError) {
        console.error('Room assignment error:', assignmentError);
        throw assignmentError;
      }

      console.log('Room assignment successful:', data);

      toast.success(`Room${selectedOccupants.length > 1 ? 's' : ''} assigned successfully`);
      onSuccess();
      return true;
    } catch (error: any) {
      console.error('Failed to assign rooms:', error);
      toast.error(error.message || "Failed to assign rooms");
      return false;
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    isAssigning,
    handleAssignRoom
  };
}
