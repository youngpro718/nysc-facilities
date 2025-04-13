import { supabase } from '@/integrations/supabase/client';
import { 
  CourtTerm, 
  TermAssignment, 
  TermPersonnel,
  CreateTermFormData,
  CreateTermAssignmentFormData,
  CreateTermPersonnelFormData
} from '../types/termTypes';

export async function fetchTerms(): Promise<CourtTerm[]> {
  try {
    // First check if the court_terms table exists
    const { error: tableCheckError } = await supabase
      .from('court_terms' as any)
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking court_terms table:', tableCheckError);
      return []; // Return empty array instead of throwing
    }
    
    const { data, error } = await supabase
      .from('court_terms' as any)
      .select('*')
      .order('start_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching court terms:', error);
      return []; // Return empty array instead of throwing
    }
    return (data || []) as unknown as CourtTerm[];
  } catch (e) {
    console.error('Unexpected error in fetchTerms:', e);
    return []; // Return empty array on any error
  }
}

export async function fetchTermById(id: string): Promise<CourtTerm | null> {
  try {
    if (!id) return null;
    
    const { data, error } = await supabase
      .from('court_terms' as any)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching court term ${id}:`, error);
      return null; // Return null instead of throwing
    }
    return data as unknown as CourtTerm;
  } catch (e) {
    console.error(`Unexpected error in fetchTermById for ${id}:`, e);
    return null; // Return null on any error
  }
}

export async function fetchCurrentTerm(): Promise<CourtTerm | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // First check if the court_terms table exists
    const { error: tableCheckError } = await supabase
      .from('court_terms' as any)
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking court_terms table:', tableCheckError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('court_terms' as any)
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      // PGRST116 is expected when no current term is found
      if (error.code !== 'PGRST116') {
        console.error('Error fetching current term:', error);
      }
      return null;
    }
    
    return data as unknown as CourtTerm;
  } catch (e) {
    console.error('Unexpected error in fetchCurrentTerm:', e);
    return null;
  }
}

export async function fetchTermAssignments(termId: string): Promise<TermAssignment[]> {
  try {
    const { data: assignments, error } = await supabase
      .from("term_assignments" as any)
      .select("*")
      .eq("term_id", termId);

    if (error) {
      console.error("Error fetching assignments:", error);
      return []; // Return empty array on error
    }

    if (!assignments || assignments.length === 0) {
      return []; // Return empty array if no assignments
    }

    // Enhance assignments with room and part data
    const enhancedAssignments = await Promise.all(
      assignments.map(async (assignment: any) => {
        let roomData = null;
        let partData = null;

        // Try to fetch room data - first check if court_rooms table exists
        if (assignment.room_id) {
          try {
            // First try to get the room from the regular rooms table 
            // (which should always exist)
            const { data: room, error: roomError } = await supabase
              .from("rooms" as any)
              .select("*")
              .eq("id", assignment.room_id)
              .single();
            
            if (!roomError && room) {
              roomData = room;
            }
            
            // Then try to get additional data from court_rooms if it exists
            try {
              const { data: courtRoom, error: courtRoomError } = await supabase
                .from("court_rooms" as any)
                .select("*")
                .eq("room_id", assignment.room_id)
                .single();
                
              if (!courtRoomError && courtRoom) {
                // Merge court_rooms data with rooms data
                roomData = { ...roomData, ...courtRoom };
              }
            } catch (courtRoomErr) {
              // Silently handle court_rooms table not existing
              console.warn("Could not fetch room data:", roomData ? "Court rooms table may not exist" : "Room not found");
            }
          } catch (err) {
            console.warn("Error fetching room:", err);
          }
        }

        // Try to fetch part data
        if (assignment.part_id) {
          try {
            const { data: part, error: partError } = await supabase
              .from("court_parts" as any)
              .select("*")
              .eq("id", assignment.part_id)
              .single();

            if (!partError && part) {
              partData = part;
            } else if (partError) {
              console.warn("Could not fetch part data:", partError);
            }
          } catch (err) {
            console.warn("Error fetching part:", err);
          }
        }

        // Return enhanced assignment with room and part data
        return {
          ...assignment,
          room: roomData,
          part: partData,
        } as unknown as TermAssignment;
      })
    );

    return enhancedAssignments;
  } catch (error) {
    console.error("Unexpected error in fetchTermAssignments:", error);
    return []; // Return empty array on unexpected error
  }
}

export async function fetchTermPersonnel(termId: string): Promise<TermPersonnel[]> {
  try {
    if (!termId) return [];
    
    // First check if the term_personnel table exists
    const { error: tableCheckError } = await supabase
      .from('term_personnel' as any)
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking term_personnel table:', tableCheckError);
      return []; // Return empty array instead of throwing
    }
    
    const { data, error } = await supabase
      .from('term_personnel' as any)
      .select('*')
      .eq('term_id', termId)
      .order('role', { ascending: true });
      
    if (error) {
      console.error(`Error fetching term personnel for ${termId}:`, error);
      return []; // Return empty array instead of throwing
    }
    return (data || []) as unknown as TermPersonnel[];
  } catch (e) {
    console.error(`Unexpected error in fetchTermPersonnel for ${termId}:`, e);
    return []; // Return empty array on any error
  }
}

export async function createTerm(data: CreateTermFormData): Promise<string> {
  const now = new Date().toISOString();
  const termData = {
    ...data,
    created_at: now,
    updated_at: now
  };

  const { data: insertData, error } = await supabase
    .from('court_terms' as any)
    .insert([termData])
    .select('id')
    .single();
    
  if (error) throw new Error(`Error creating court term: ${error.message}`);
  return (insertData as any).id;
}

export async function createTermAssignment(data: CreateTermAssignmentFormData): Promise<string> {
  // Create or find part_id if part_code is provided
  let part_id = undefined;
  if (data.part_code) {
    const { data: existingPart } = await supabase
      .from('court_parts' as any)
      .select('id')
      .eq('part_code', data.part_code)
      .single();
      
    if (existingPart) {
      part_id = (existingPart as any).id;
    } else {
      const { data: newPart, error: partError } = await supabase
        .from('court_parts' as any)
        .insert([{ part_code: data.part_code }])
        .select('id')
        .single();
        
      if (partError) throw new Error(`Error creating court part: ${partError.message}`);
      part_id = (newPart as any).id;
    }
  }
  
  // Create the assignment
  const { data: insertData, error } = await supabase
    .from('term_assignments' as any)
    .insert([{
      ...data,
      part_id
    }])
    .select('id')
    .single();
    
  if (error) throw new Error(`Error creating term assignment: ${error.message}`);
  return (insertData as any).id;
}

export async function createTermPersonnel(data: CreateTermPersonnelFormData): Promise<string> {
  const { data: insertData, error } = await supabase
    .from('term_personnel' as any)
    .insert([data])
    .select('id')
    .single();
    
  if (error) throw new Error(`Error creating term personnel: ${error.message}`);
  return (insertData as any).id;
}

export async function bulkCreateTermData(
  termData: Partial<CourtTerm>,
  assignments: Partial<TermAssignment>[],
  personnel: Partial<TermPersonnel>[]
): Promise<string> {
  // Add required fields to term data and validate
  const now = new Date().toISOString();
  
  // Ensure all required fields are present
  if (!termData.term_number) {
    throw new Error('Term number is required');
  }
  if (!termData.term_name) {
    throw new Error('Term name is required');
  }
  if (!termData.start_date) {
    throw new Error('Start date is required');
  }
  if (!termData.end_date) {
    throw new Error('End date is required');
  }
  if (!termData.location) {
    throw new Error('Location is required');
  }

  // Ensure dates are in proper ISO format
  try {
    const startDate = new Date(termData.start_date).toISOString().split('T')[0];
    const endDate = new Date(termData.end_date).toISOString().split('T')[0];
    
    // Validate end date is after start date
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }

    const termWithRequiredFields = {
      ...termData,
      description: termData.description || '', // Ensure description is never undefined
      start_date: startDate,
      end_date: endDate,
      created_at: now,
      updated_at: now,
      metadata: termData.metadata || {} // Ensure metadata is never undefined
    };

    // Remove any id field if it exists to let Supabase generate it
    delete (termWithRequiredFields as any).id;

    // Create the term
    const { data: termInsert, error: termError } = await supabase
      .from('court_terms' as any)
      .insert([termWithRequiredFields])
      .select('id')
      .single();
      
    if (termError) throw new Error(`Error creating term: ${termError.message}`);
    if (!termInsert?.id) throw new Error('Failed to get term ID after creation');
    
    const termId = (termInsert as any).id;

    // Create personnel
    const personnelWithTermId = personnel.map(p => {
      const personnelData = {
        ...p,
        term_id: termId,
        created_at: now,
        updated_at: now
      };
      delete (personnelData as any).id; // Remove any id field to let Supabase generate it
      return personnelData;
    });
    
    if (personnelWithTermId.length > 0) {
      const { error: personnelError } = await supabase
        .from('term_personnel' as any)
        .insert(personnelWithTermId);
        
      if (personnelError) throw new Error(`Error creating personnel: ${personnelError.message}`);
    }
    
    // Create assignments
    const assignmentsWithTermId = await Promise.all(
      assignments.map(async (assignment) => {
        // Create or find part if part_code is provided
        let part_id = undefined;
        if (assignment.part_code) {
          try {
            // First try to find the court part
            const { data: existingParts, error: existingPartsError } = await supabase
              .from('court_parts' as any)
              .select('id')
              .eq('part_code', assignment.part_code);
            
            if (existingPartsError) {
              console.error(`Error finding court part for code ${assignment.part_code}:`, existingPartsError);
            } else if (existingParts && existingParts.length > 0 && (existingParts[0] as any)?.id) {
              part_id = (existingParts[0] as any).id;
            } else {
              // If not found, create a new court part
              const { data: newPart, error: partError } = await supabase
                .from('court_parts' as any)
                .insert([{ 
                  part_code: assignment.part_code,
                  description: '', // Ensure description is never undefined
                  created_at: now,
                  updated_at: now
                }])
                .select('id')
                .single();
              
              if (partError) {
                console.error(`Error creating court part for code ${assignment.part_code}:`, partError);
              } else if (newPart && (newPart as any)?.id) {
                part_id = (newPart as any).id;
              }
            }
          } catch (e) {
            console.error(`Error handling court part ${assignment.part_code}:`, e);
          }
        }
        
        // Remove part_code from assignment data before sending to Supabase
        const assignmentData = {
          ...assignment,
          term_id: termId,
          part_id,
          created_at: now,
          updated_at: now
        };
        
        // Remove fields that don't exist in the database schema
        delete (assignmentData as any).id; // Remove any id field to let Supabase generate it
        delete (assignmentData as any).part_code; // Remove part_code as it's not in the schema
        delete (assignmentData as any).room_number; // Remove room_number as it's not in the schema
        delete (assignmentData as any).part; // Remove related objects that aren't columns
        delete (assignmentData as any).room; // Remove related objects that aren't columns
        delete (assignmentData as any).term; // Remove related objects that aren't columns
        delete (assignmentData as any).end_date; // Remove end_date as it's not in the schema yet
        delete (assignmentData as any).start_date; // Remove start_date as it's not in the schema yet
        
        return assignmentData;
      })
    );
    
    if (assignmentsWithTermId.length > 0) {
      const { error: assignmentsError } = await supabase
        .from('term_assignments' as any)
        .insert(assignmentsWithTermId);
        
      if (assignmentsError) throw new Error(`Error creating assignments: ${assignmentsError.message}`);
    }
    
    return termId;
  } catch (e) {
    console.error('Unexpected error in bulkCreateTermData:', e);
    throw e;
  }
}

export async function updateTerm(id: string, data: Partial<CourtTerm>): Promise<void> {
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('court_terms' as any)
      .update(updateData)
      .eq('id', id);
      
    if (error) throw new Error(`Error updating court term: ${error.message}`);
  } catch (e) {
    console.error(`Unexpected error in updateTerm for ${id}:`, e);
    throw e;
  }
}

export async function deleteTerm(id: string): Promise<void> {
  try {
    // Due to cascading delete in the schema, this will also delete related assignments and personnel
    const { error } = await supabase
      .from('court_terms' as any)
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting court term: ${error.message}`);
  } catch (e) {
    console.error(`Unexpected error in deleteTerm for ${id}:`, e);
    throw e;
  }
}
