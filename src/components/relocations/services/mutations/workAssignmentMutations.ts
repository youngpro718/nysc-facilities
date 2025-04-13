import { supabase } from "@/integrations/supabase/client";
import { WorkAssignment, CourtSession } from "../../types/relocationTypes";

// Add a work assignment to a relocation
export async function addWorkAssignment(
  workAssignmentData: Omit<WorkAssignment, 'id' | 'status' | 'created_at' | 'updated_at' | 'completed_at'>
) {
  try {
    // First, get the relocation to update its metadata
    const { data: relocation, error: relocationError } = await supabase
      .from('relocations')
      .select('*')
      .eq('id', workAssignmentData.relocation_id)
      .single();

    if (relocationError) throw relocationError;

    // Create a new work assignment object
    const newWorkAssignment: Omit<WorkAssignment, 'id' | 'created_at' | 'updated_at'> = {
      ...workAssignmentData,
      status: 'scheduled',
    };

    // Update the relocation's metadata to include the work assignment
    const metadata = relocation.metadata || {};
    const workAssignments = metadata.work_assignments || [];
    
    // Generate a unique ID for the work assignment
    const workAssignmentId = crypto.randomUUID();
    
    // Add the new work assignment to the array
    workAssignments.push({
      ...newWorkAssignment,
      id: workAssignmentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    // Update the metadata
    metadata.work_assignments = workAssignments;
    
    // Update the relocation with the new metadata
    const { data, error } = await supabase
      .from('relocations')
      .update({ metadata })
      .eq('id', workAssignmentData.relocation_id)
      .select();

    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error("Error adding work assignment:", error);
    throw error;
  }
}

// Update a work assignment's status
export async function updateWorkAssignmentStatus({
  relocationId,
  workAssignmentId,
  status,
  completionNotes
}: {
  relocationId: string;
  workAssignmentId: string;
  status: WorkAssignment['status'];
  completionNotes?: string;
}) {
  try {
    // First, get the relocation to update its metadata
    const { data: relocation, error: relocationError } = await supabase
      .from('relocations')
      .select('*')
      .eq('id', relocationId)
      .single();

    if (relocationError) throw relocationError;

    // Update the work assignment status in the metadata
    const metadata = relocation.metadata || {};
    const workAssignments = metadata.work_assignments || [];
    
    // Find the work assignment to update
    const updatedWorkAssignments = workAssignments.map((assignment: WorkAssignment) => {
      if (assignment.id === workAssignmentId) {
        return {
          ...assignment,
          status,
          completion_notes: completionNotes,
          completed_at: status === 'completed' ? new Date().toISOString() : assignment.completed_at,
          updated_at: new Date().toISOString(),
        };
      }
      return assignment;
    });
    
    // Update the metadata
    metadata.work_assignments = updatedWorkAssignments;
    
    // Update the relocation with the new metadata
    const { data, error } = await supabase
      .from('relocations')
      .update({ metadata })
      .eq('id', relocationId)
      .select();

    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error("Error updating work assignment status:", error);
    throw error;
  }
}

// Add a court session to a relocation
export async function addCourtSession(
  courtSessionData: Omit<CourtSession, 'id' | 'created_at' | 'updated_at'>
) {
  try {
    // First, get the relocation to update its metadata
    const { data: relocation, error: relocationError } = await supabase
      .from('relocations')
      .select('*')
      .eq('id', courtSessionData.relocation_id)
      .single();

    if (relocationError) throw relocationError;

    // Update the relocation's metadata to include the court session
    const metadata = relocation.metadata || {};
    const courtSessions = metadata.court_sessions || [];
    
    // Generate a unique ID for the court session
    const courtSessionId = crypto.randomUUID();
    
    // Add the new court session to the array
    courtSessions.push({
      ...courtSessionData,
      id: courtSessionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    // Update the metadata
    metadata.court_sessions = courtSessions;
    
    // Update the relocation with the new metadata
    const { data, error } = await supabase
      .from('relocations')
      .update({ metadata })
      .eq('id', courtSessionData.relocation_id)
      .select();

    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error("Error adding court session:", error);
    throw error;
  }
}

// Delete a court session
export async function deleteCourtSession(
  relocationId: string,
  courtSessionId: string
) {
  try {
    // First, get the relocation to update its metadata
    const { data: relocation, error: relocationError } = await supabase
      .from('relocations')
      .select('*')
      .eq('id', relocationId)
      .single();

    if (relocationError) throw relocationError;

    // Update the court sessions in the metadata
    const metadata = relocation.metadata || {};
    const courtSessions = metadata.court_sessions || [];
    
    // Filter out the court session to delete
    const updatedCourtSessions = courtSessions.filter(
      (session: CourtSession) => session.id !== courtSessionId
    );
    
    // Update the metadata
    metadata.court_sessions = updatedCourtSessions;
    
    // Update the relocation with the new metadata
    const { data, error } = await supabase
      .from('relocations')
      .update({ metadata })
      .eq('id', relocationId)
      .select();

    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error("Error deleting court session:", error);
    throw error;
  }
}
