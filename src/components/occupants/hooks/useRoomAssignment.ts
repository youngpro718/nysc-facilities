import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type PersonSourceType = 'profile' | 'personnel_profile' | 'occupant';

export interface PersonForAssignment {
  id: string;
  source_type: PersonSourceType;
}

export function useRoomAssignment(onSuccess: () => void) {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignRoom = async (
    selectedRoom: string,
    selectedPersons: PersonForAssignment[] | string[],
    assignmentType: string,
    isPrimaryAssignment: boolean
  ) => {
    // Normalize to PersonForAssignment[] - backwards compatible with string[]
    const persons: PersonForAssignment[] = selectedPersons.map((p) => {
      if (typeof p === 'string') {
        // Legacy: assume occupant if just string ID passed
        return { id: p, source_type: 'occupant' as PersonSourceType };
      }
      return p;
    });

    logger.debug('[useRoomAssignment] Function called with:', {
      selectedRoom,
      persons,
      assignmentType,
      isPrimaryAssignment
    });

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!selectedRoom) {
      logger.debug('[useRoomAssignment] No room selected');
      toast.error("Please select a room to assign");
      return false;
    }
    if (!uuidRe.test(selectedRoom)) {
      logger.debug('[useRoomAssignment] Invalid room UUID');
      toast.error("Invalid room id format");
      return false;
    }
    if (!persons?.length) {
      logger.debug('[useRoomAssignment] No persons provided');
      toast.error("No persons selected");
      return false;
    }
    const invalidIds = persons.filter((p) => !uuidRe.test(p.id));
    if (invalidIds.length) {
      logger.debug('[useRoomAssignment] Invalid person UUIDs:', invalidIds);
      toast.error(`Invalid person id(s): ${invalidIds.map(p => p.id).join(", ")}`);
      return false;
    }

    try {
      setIsAssigning(true);

      // Require a real Supabase session (RLS needs authenticated role)
      const { data: authData, error: authErr } = await supabase.auth.getSession();
      if (authErr) {
        logger.error('Auth session retrieval error:', authErr);
      }
      if (!authData?.session) {
        toast.error("You must be signed in to assign rooms.");
        return false;
      }

      // Build assignments using the correct ID column based on source_type
      const assignments = persons.map((person) => {
        const base = {
          room_id: selectedRoom,
          assignment_type: assignmentType,
          assigned_at: new Date().toISOString(),
          is_primary: isPrimaryAssignment
        };

        switch (person.source_type) {
          case 'profile':
            return { ...base, profile_id: person.id };
          case 'personnel_profile':
            return { ...base, personnel_profile_id: person.id };
          case 'occupant':
          default:
            return { ...base, occupant_id: person.id };
        }
      });

      logger.debug('Creating room assignments:', assignments);

      // Check for existing primary assignments if this is a primary assignment
      if (isPrimaryAssignment) {
        for (const person of persons) {
          let query = supabase
            .from("occupant_room_assignments")
            .select("id")
            .eq("assignment_type", assignmentType)
            .eq("is_primary", true)
            .limit(1);

          // Query using the correct column
          switch (person.source_type) {
            case 'profile':
              query = query.eq("profile_id", person.id);
              break;
            case 'personnel_profile':
              query = query.eq("personnel_profile_id", person.id);
              break;
            default:
              query = query.eq("occupant_id", person.id);
          }

          const { data: existingPrimary } = await query;

          if (existingPrimary && existingPrimary.length > 0) {
            // Update existing primary to non-primary
            let updateQuery = supabase
              .from("occupant_room_assignments")
              .update({ is_primary: false })
              .eq("assignment_type", assignmentType)
              .eq("is_primary", true);

            switch (person.source_type) {
              case 'profile':
                updateQuery = updateQuery.eq("profile_id", person.id);
                break;
              case 'personnel_profile':
                updateQuery = updateQuery.eq("personnel_profile_id", person.id);
                break;
              default:
                updateQuery = updateQuery.eq("occupant_id", person.id);
            }

            await updateQuery;
          }
        }
      }

      const { data, error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments)
        .select();

      if (assignmentError) {
        // Provide rich diagnostics for debugging
        logger.error('Room assignment error:', {
          error: assignmentError,
          assignments,
          context: {
            selectedRoom,
            persons,
            assignmentType,
            isPrimaryAssignment,
          },
        });
        throw assignmentError;
      }

      logger.debug('Room assignment successful:', data);

      toast.success(`Room${persons.length > 1 ? 's' : ''} assigned successfully`);
      onSuccess();
      return true;
    } catch (error) {
      // Compose detailed error message from Supabase error shape when available
      const code = error?.code ? ` [${error.code}]` : '';
      const details = error?.details ? `\nDetails: ${error.details}` : '';
      const hint = error?.hint ? `\nHint: ${error.hint}` : '';
      const msg = error?.message || "Failed to assign rooms";
      const composed = `${msg}${code}${details}${hint}`;
      logger.error('Failed to assign rooms:', error);
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
