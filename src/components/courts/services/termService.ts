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
      .from('court_terms')
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking court_terms table:', tableCheckError);
      return []; // Return empty array instead of throwing
    }
    
    const { data, error } = await supabase
      .from('court_terms')
      .select('*')
      .order('start_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching court terms:', error);
      return []; // Return empty array instead of throwing
    }
    return data || [];
  } catch (e) {
    console.error('Unexpected error in fetchTerms:', e);
    return []; // Return empty array on any error
  }
}

export async function fetchTermById(id: string): Promise<CourtTerm | null> {
  try {
    if (!id) return null;
    
    const { data, error } = await supabase
      .from('court_terms')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching court term ${id}:`, error);
      return null; // Return null instead of throwing
    }
    return data;
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
      .from('court_terms')
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking court_terms table:', tableCheckError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('court_terms')
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
    
    return data || null;
  } catch (e) {
    console.error('Unexpected error in fetchCurrentTerm:', e);
    return null;
  }
}

export async function fetchTermAssignments(termId: string): Promise<TermAssignment[]> {
  try {
    // First check if the term_assignments table exists
    const { error: tableCheckError } = await supabase
      .from('term_assignments')
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking term_assignments table:', tableCheckError);
      return []; // Return empty array instead of throwing
    }
    
    // Proceed with normal query
    const { data, error } = await supabase
      .from('term_assignments')
      .select(`
        *,
        room:rooms(id, name, room_number, room_type, status, description),
        part:court_parts(*)
      `)
      .eq('term_id', termId)
      .order('part_code', { ascending: true });
      
    if (error) {
      console.error('Error in term assignments query:', error);
      return []; // Return empty array instead of throwing
    }
    
    // Handle potential null room references
    return (data || []).map(assignment => ({
      ...assignment,
      // Ensure room is never null for UI components
      room: assignment.room || { 
        id: assignment.room_id || null,
        name: 'Unknown Room', 
        room_number: assignment.room_number || 'N/A',
        room_type: 'unknown',
        status: 'unknown',
        description: null
      }
    }));
  } catch (e) {
    console.error('Unexpected error in fetchTermAssignments:', e);
    return []; // Return empty array on any error
  }
}

export async function fetchTermPersonnel(termId: string): Promise<TermPersonnel[]> {
  try {
    if (!termId) return [];
    
    // First check if the term_personnel table exists
    const { error: tableCheckError } = await supabase
      .from('term_personnel')
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error checking term_personnel table:', tableCheckError);
      return []; // Return empty array instead of throwing
    }
    
    const { data, error } = await supabase
      .from('term_personnel')
      .select('*')
      .eq('term_id', termId)
      .order('role', { ascending: true });
      
    if (error) {
      console.error(`Error fetching term personnel for ${termId}:`, error);
      return []; // Return empty array instead of throwing
    }
    return data || [];
  } catch (e) {
    console.error(`Unexpected error in fetchTermPersonnel for ${termId}:`, e);
    return []; // Return empty array on any error
  }
}

export async function createTerm(data: CreateTermFormData): Promise<string> {
  const { data: insertData, error } = await supabase
    .from('court_terms')
    .insert([data])
    .select('id')
    .single();
    
  if (error) throw new Error(`Error creating court term: ${error.message}`);
  return insertData.id;
}

export async function createTermAssignment(data: CreateTermAssignmentFormData): Promise<string> {
  // Create or find part_id if part_code is provided
  let part_id = undefined;
  if (data.part_code) {
    const { data: existingPart } = await supabase
      .from('court_parts')
      .select('id')
      .eq('part_code', data.part_code)
      .single();
      
    if (existingPart) {
      part_id = existingPart.id;
    } else {
      const { data: newPart, error: partError } = await supabase
        .from('court_parts')
        .insert([{ part_code: data.part_code }])
        .select('id')
        .single();
        
      if (partError) throw new Error(`Error creating court part: ${partError.message}`);
      part_id = newPart.id;
    }
  }
  
  // Create the assignment
  const { data: insertData, error } = await supabase
    .from('term_assignments')
    .insert([{
      ...data,
      part_id
    }])
    .select('id')
    .single();
    
  if (error) throw new Error(`Error creating term assignment: ${error.message}`);
  return insertData.id;
}

export async function createTermPersonnel(data: CreateTermPersonnelFormData): Promise<string> {
  const { data: insertData, error } = await supabase
    .from('term_personnel')
    .insert([data])
    .select('id')
    .single();
    
  if (error) throw new Error(`Error creating term personnel: ${error.message}`);
  return insertData.id;
}

export async function bulkCreateTermData(
  termData: Partial<CourtTerm>,
  assignments: Partial<TermAssignment>[],
  personnel: Partial<TermPersonnel>[]
): Promise<string> {
  // Create the term
  const { data: termInsert, error: termError } = await supabase
    .from('court_terms')
    .insert([termData])
    .select('id')
    .single();
    
  if (termError) throw new Error(`Error creating term: ${termError.message}`);
  const termId = termInsert.id;
  
  // Create personnel
  const personnelWithTermId = personnel.map(p => ({
    ...p,
    term_id: termId
  }));
  
  if (personnelWithTermId.length > 0) {
    const { error: personnelError } = await supabase
      .from('term_personnel')
      .insert(personnelWithTermId);
      
    if (personnelError) throw new Error(`Error creating personnel: ${personnelError.message}`);
  }
  
  // Create assignments
  const assignmentsWithTermId = await Promise.all(
    assignments.map(async (assignment) => {
      // Create or find part if part_code is provided
      let part_id = undefined;
      if (assignment.part_code) {
        const { data: existingPart } = await supabase
          .from('court_parts')
          .select('id')
          .eq('part_code', assignment.part_code)
          .single();
          
        if (existingPart) {
          part_id = existingPart.id;
        } else {
          const { data: newPart, error: partError } = await supabase
            .from('court_parts')
            .insert([{ part_code: assignment.part_code }])
            .select('id')
            .single();
            
          if (partError) throw new Error(`Error creating court part: ${partError.message}`);
          part_id = newPart.id;
        }
      }
      
      return {
        ...assignment,
        term_id: termId,
        part_id
      };
    })
  );
  
  if (assignmentsWithTermId.length > 0) {
    const { error: assignmentsError } = await supabase
      .from('term_assignments')
      .insert(assignmentsWithTermId);
      
    if (assignmentsError) throw new Error(`Error creating assignments: ${assignmentsError.message}`);
  }
  
  return termId;
}
