
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useRoomAssignment(onSuccess: () => void) {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignRoom = async (
    selectedRoom: string,
    selectedOccupants: string[],
    assignmentType: string,
    isPrimaryAssignment: boolean
  ) => {
    console.log('[useRoomAssignment] Function called with:', {
      selectedRoom,
      selectedOccupants,
      assignmentType,
      isPrimaryAssignment
    });

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!selectedRoom) {
      console.log('[useRoomAssignment] No room selected');
      toast.error("Please select a room to assign");
      return false;
    }
    if (!uuidRe.test(selectedRoom)) {
      console.log('[useRoomAssignment] Invalid room UUID');
      toast.error("Invalid room id format");
      return false;
    }
    if (!selectedOccupants?.length) {
      console.log('[useRoomAssignment] No occupants provided');
      toast.error("No occupants selected");
      return false;
    }
    const invalidOcc = selectedOccupants.filter((id) => !uuidRe.test(id));
    if (invalidOcc.length) {
      console.log('[useRoomAssignment] Invalid occupant UUIDs:', invalidOcc);
      toast.error(`Invalid occupant id(s): ${invalidOcc.join(", ")}`);
      return false;
    }

    try {
      setIsAssigning(true);

      // Require a real Supabase session (RLS needs authenticated role)
      const { data: authData, error: authErr } = await supabase.auth.getSession();
      if (authErr) {
        console.error('Auth session retrieval error:', authErr);
      }
      if (!authData?.session) {
        toast.error("You must be signed in to assign rooms.");
        return false;
      }

      const assignments = selectedOccupants.map((occupantId) => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assignment_type: assignmentType,
        assigned_at: new Date().toISOString(),
        is_primary: isPrimaryAssignment
      }));

      console.log('Creating room assignments:', assignments);

      // Check for existing primary assignments if this is a primary assignment
      if (isPrimaryAssignment) {
        for (const occupantId of selectedOccupants) {
          const { data: existingPrimary } = await supabase
            .from("occupant_room_assignments")
            .select("id")
            .eq("occupant_id", occupantId)
            .eq("assignment_type", assignmentType)
            .eq("is_primary", true)
            .limit(1);

          if (existingPrimary && existingPrimary.length > 0) {
            // Update existing primary to non-primary
            await supabase
              .from("occupant_room_assignments")
              .update({ is_primary: false })
              .eq("occupant_id", occupantId)
              .eq("assignment_type", assignmentType)
              .eq("is_primary", true);
          }
        }
      }

      const { data, error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments)
        .select();

      if (assignmentError) {
        // Provide rich diagnostics for debugging
        console.error('Room assignment error:', assignmentError, {
          assignments,
          context: {
            selectedRoom,
            selectedOccupants,
            assignmentType,
            isPrimaryAssignment,
          },
        });
        throw assignmentError;
      }

      console.log('Room assignment successful:', data);

      toast.success(`Room${selectedOccupants.length > 1 ? 's' : ''} assigned successfully`);
      onSuccess();
      return true;
    } catch (error: any) {
      // Compose detailed error message from Supabase error shape when available
      const code = error?.code ? ` [${error.code}]` : '';
      const details = error?.details ? `\nDetails: ${error.details}` : '';
      const hint = error?.hint ? `\nHint: ${error.hint}` : '';
      const msg = error?.message || "Failed to assign rooms";
      const composed = `${msg}${code}${details}${hint}`;
      console.error('Failed to assign rooms:', error);
      toast.error(composed);
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
