import { supabase } from '@/lib/supabase';
import type { JudgeStatus } from '@/hooks/useCourtPersonnel';

/**
 * Update a judge's status (active, jho, departed)
 */
export async function updateJudgeStatus(
  personnelId: string,
  status: JudgeStatus,
  departedDate?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    judge_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'departed') {
    updateData.departed_date = departedDate || new Date().toISOString().split('T')[0];
    updateData.is_available_for_assignment = false;
  } else if (status === 'jho') {
    updateData.title = 'JHO';
    updateData.is_available_for_assignment = true;
    updateData.departed_date = null;
  } else {
    updateData.title = 'Justice';
    updateData.is_available_for_assignment = true;
    updateData.departed_date = null;
  }

  const { error } = await supabase
    .from('personnel_profiles')
    .update(updateData)
    .eq('id', personnelId);

  if (error) throw error;
}

/**
 * Quick-add a new judge to personnel_profiles with associated info.
 * Judges come with: court attorney, chambers room, courtroom assignment.
 */
export async function addNewJudge(params: {
  firstName: string;
  lastName: string;
  status?: JudgeStatus;
  courtAttorney?: string;
  chambersRoom?: string;
  courtroomId?: string;
  part?: string;
}): Promise<string> {
  const displayName = `${params.firstName.charAt(0).toUpperCase()}. ${params.lastName.toUpperCase()}`;
  const fullName = `${params.firstName} ${params.lastName}`;
  const title = params.status === 'jho' ? 'JHO' : 'Justice';

  // Step 1: Create the judge in personnel_profiles
  const { data, error } = await supabase
    .from('personnel_profiles')
    .insert({
      first_name: params.firstName,
      last_name: params.lastName,
      full_name: fullName,
      display_name: displayName,
      primary_role: 'judge',
      title,
      judge_status: params.status || 'active',
      is_active: true,
      is_available_for_assignment: true,
      court_attorney: params.courtAttorney || null,
      chambers_room_number: params.chambersRoom || null,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Step 2: If a courtroom + part were provided, create the court assignment
  if (params.courtroomId && params.part) {
    // Look up the room_id for this court_room
    const { data: courtRoom } = await supabase
      .from('court_rooms')
      .select('room_id, room_number')
      .eq('id', params.courtroomId)
      .single();

    if (courtRoom) {
      // Get max sort_order
      const { data: maxSort } = await supabase
        .from('court_assignments')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      await supabase.from('court_assignments').insert({
        room_id: courtRoom.room_id,
        room_number: courtRoom.room_number || '',
        part: params.part,
        justice: displayName,
        sort_order: ((maxSort?.sort_order as number) || 0) + 1,
      });
    }
  }

  return data.id;
}

/**
 * Get everything associated with a judge for the departure workflow.
 */
export interface JudgeDepartureInfo {
  personnelId: string;
  displayName: string;
  courtAttorney: string | null;
  chambersRoom: string | null;
  assignment: {
    assignmentId: string;
    part: string;
    roomNumber: string;
    roomId: string;
    clerks: string[] | null;
    sergeant: string | null;
  } | null;
}

export async function getJudgeDepartureInfo(personnelId: string): Promise<JudgeDepartureInfo | null> {
  // Get judge profile
  const { data: judge, error: judgeError } = await supabase
    .from('personnel_profiles')
    .select('id, display_name, court_attorney, chambers_room_number')
    .eq('id', personnelId)
    .single();

  if (judgeError || !judge) return null;

  // Get their court assignment
  const { data: assignment } = await supabase
    .from('court_assignments')
    .select('id, part, room_number, room_id, clerks, sergeant')
    .eq('justice', judge.display_name)
    .maybeSingle();

  return {
    personnelId: judge.id,
    displayName: judge.display_name || '',
    courtAttorney: judge.court_attorney,
    chambersRoom: judge.chambers_room_number,
    assignment: assignment ? {
      assignmentId: assignment.id,
      part: assignment.part || '',
      roomNumber: assignment.room_number || '',
      roomId: assignment.room_id || '',
      clerks: assignment.clerks,
      sergeant: assignment.sergeant,
    } : null,
  };
}

/**
 * Process a judge departure with full handoff.
 * - Marks judge as departed
 * - Clears or reassigns their court assignment
 * - Clears or reassigns their chambers
 */
export async function processJudgeDeparture(params: {
  personnelId: string;
  displayName: string;
  // Courtroom handoff
  assignmentAction: 'clear' | 'reassign';
  newJusticeForAssignment?: string; // display_name of replacement judge
  // Chambers handoff
  chambersAction: 'clear' | 'reassign';
  newChambersOccupant?: string; // free text — who's moving in
}): Promise<void> {
  // 1. Mark judge as departed
  await updateJudgeStatus(params.personnelId, 'departed');

  // 2. Handle court assignment
  const { data: assignment } = await supabase
    .from('court_assignments')
    .select('id')
    .eq('justice', params.displayName)
    .maybeSingle();

  if (assignment) {
    if (params.assignmentAction === 'reassign' && params.newJusticeForAssignment) {
      // Reassign the courtroom/part to the new judge
      await supabase
        .from('court_assignments')
        .update({ justice: params.newJusticeForAssignment })
        .eq('id', assignment.id);
    } else {
      // Clear the justice from the assignment (room stays, part stays, judge removed)
      await supabase
        .from('court_assignments')
        .update({ justice: null })
        .eq('id', assignment.id);
    }
  }

  // 3. Handle chambers
  if (params.chambersAction === 'reassign' && params.newChambersOccupant) {
    // Find the new occupant in personnel_profiles and set their chambers
    const { data: newOccupant } = await supabase
      .from('personnel_profiles')
      .select('id')
      .or(`display_name.ilike.%${params.newChambersOccupant}%,full_name.ilike.%${params.newChambersOccupant}%`)
      .eq('primary_role', 'judge')
      .limit(1)
      .maybeSingle();

    if (newOccupant) {
      // Get the departing judge's chambers room
      const { data: departingJudge } = await supabase
        .from('personnel_profiles')
        .select('chambers_room_number')
        .eq('id', params.personnelId)
        .single();

      if (departingJudge?.chambers_room_number) {
        await supabase
          .from('personnel_profiles')
          .update({ chambers_room_number: departingJudge.chambers_room_number })
          .eq('id', newOccupant.id);
      }
    }
  }

  // 4. Clear the departed judge's chambers
  await supabase
    .from('personnel_profiles')
    .update({ chambers_room_number: null, court_attorney: null })
    .eq('id', params.personnelId);
}

/**
 * Move a judge to a different part/courtroom.
 * If the destination already has a judge, swap them.
 */
export async function moveJudgeToPart(params: {
  judgeName: string;
  targetAssignmentId: string;
  swapWithJudge?: string; // if destination has a judge, their name
  sourceAssignmentId?: string; // the judge's current assignment
}): Promise<void> {
  if (params.swapWithJudge && params.sourceAssignmentId) {
    // Swap: put the other judge in the source assignment
    await supabase
      .from('court_assignments')
      .update({ justice: params.swapWithJudge })
      .eq('id', params.sourceAssignmentId);
  } else if (params.sourceAssignmentId) {
    // Clear the source assignment
    await supabase
      .from('court_assignments')
      .update({ justice: null })
      .eq('id', params.sourceAssignmentId);
  }

  // Put this judge in the target assignment
  const { error } = await supabase
    .from('court_assignments')
    .update({ justice: params.judgeName })
    .eq('id', params.targetAssignmentId);

  if (error) throw error;
}

/**
 * Update a judge's details (court attorney, chambers).
 */
export async function updateJudgeDetails(params: {
  personnelId: string;
  courtAttorney?: string | null;
  chambersRoom?: string | null;
}): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (params.courtAttorney !== undefined) {
    updateData.court_attorney = params.courtAttorney || null;
  }
  if (params.chambersRoom !== undefined) {
    updateData.chambers_room_number = params.chambersRoom || null;
  }

  const { error } = await supabase
    .from('personnel_profiles')
    .update(updateData)
    .eq('id', params.personnelId);

  if (error) throw error;
}

/**
 * Swap chambers between two judges.
 */
export async function swapChambers(
  judgeAId: string,
  judgeBId: string
): Promise<void> {
  // Get both chambers
  const { data: judgeA } = await supabase
    .from('personnel_profiles')
    .select('chambers_room_number')
    .eq('id', judgeAId)
    .single();

  const { data: judgeB } = await supabase
    .from('personnel_profiles')
    .select('chambers_room_number')
    .eq('id', judgeBId)
    .single();

  // Swap
  await supabase
    .from('personnel_profiles')
    .update({ chambers_room_number: judgeB?.chambers_room_number || null })
    .eq('id', judgeAId);

  await supabase
    .from('personnel_profiles')
    .update({ chambers_room_number: judgeA?.chambers_room_number || null })
    .eq('id', judgeBId);
}

/**
 * Get all court assignments for the move picker.
 */
export interface AssignmentSlot {
  assignmentId: string;
  part: string;
  roomNumber: string;
  justice: string | null;
}

export async function getAllAssignmentSlots(): Promise<AssignmentSlot[]> {
  const { data, error } = await supabase
    .from('court_assignments')
    .select('id, part, room_number, justice')
    .order('part');

  if (error) throw error;

  return (data || []).map((a) => ({
    assignmentId: a.id,
    part: a.part || '',
    roomNumber: a.room_number || '',
    justice: a.justice || null,
  }));
}

/**
 * Find a judge by name in personnel_profiles
 */
export async function findJudgeByName(name: string): Promise<{
  id: string;
  displayName: string;
  judgeStatus: JudgeStatus;
} | null> {
  const { data, error } = await supabase
    .from('personnel_profiles')
    .select('id, display_name, judge_status')
    .or(`display_name.ilike.%${name}%,full_name.ilike.%${name}%`)
    .eq('primary_role', 'judge')
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    displayName: data.display_name || '',
    judgeStatus: (data.judge_status as JudgeStatus) || 'active',
  };
}
