import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type StaffRole = 'clerk' | 'sergeant' | 'officer';

/**
 * Add a new staff member (clerk, sergeant, or officer) to personnel_profiles.
 * Optionally assign them to a courtroom immediately.
 */
export async function addNewStaff(params: {
    firstName: string;
    lastName: string;
    role: StaffRole;
    phone?: string;
    extension?: string;
    assignToRoomId?: string; // court_assignments.room_id to add them to
}): Promise<string> {
    const displayName = `${params.firstName} ${params.lastName}`;
    const fullName = displayName;

    // Map role to title for personnel_profiles
    const titleMap: Record<StaffRole, string> = {
        clerk: 'Court Clerk',
        sergeant: 'Sergeant',
        officer: 'Court Officer',
    };

    // 1. Create in personnel_profiles
    const { data, error } = await supabase
        .from('personnel_profiles')
        .insert({
            first_name: params.firstName,
            last_name: params.lastName,
            full_name: fullName,
            display_name: displayName,
            primary_role: params.role,
            title: titleMap[params.role],
            is_active: true,
            is_available_for_assignment: true,
            phone: params.phone || null,
            extension: params.extension || null,
        })
        .select('id')
        .single();

    if (error) throw error;

    // 2. If assigning to a courtroom, update court_assignments
    if (params.assignToRoomId) {
        await assignStaffToRoom(displayName, params.role, params.assignToRoomId);
    }

    return data.id;
}

/**
 * Assign a staff member to a courtroom's assignment.
 * - Clerks get appended to the clerks[] array
 * - Sergeants replace the sergeant field
 */
export async function assignStaffToRoom(
    staffName: string,
    role: StaffRole,
    roomId: string
): Promise<void> {
    const { data: assignment, error: fetchErr } = await supabase
        .from('court_assignments')
        .select('id, clerks, sergeant')
        .eq('room_id', roomId)
        .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!assignment) {
        logger.warn(`No court assignment found for room_id ${roomId}`);
        return;
    }

    if (role === 'clerk') {
        const currentClerks = (assignment.clerks as string[]) || [];
        if (!currentClerks.includes(staffName)) {
            await supabase
                .from('court_assignments')
                .update({ clerks: [...currentClerks, staffName] })
                .eq('id', assignment.id);
        }
    } else {
        // Sergeant or officer — goes into sergeant field
        await supabase
            .from('court_assignments')
            .update({ sergeant: staffName })
            .eq('id', assignment.id);
    }
}

/**
 * Remove a staff member from a courtroom's assignment.
 */
export async function removeStaffFromRoom(
    staffName: string,
    role: StaffRole,
    roomId: string
): Promise<void> {
    const { data: assignment, error: fetchErr } = await supabase
        .from('court_assignments')
        .select('id, clerks, sergeant')
        .eq('room_id', roomId)
        .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!assignment) return;

    if (role === 'clerk') {
        const currentClerks = (assignment.clerks as string[]) || [];
        await supabase
            .from('court_assignments')
            .update({ clerks: currentClerks.filter(c => c !== staffName) })
            .eq('id', assignment.id);
    } else {
        if (assignment.sergeant === staffName) {
            await supabase
                .from('court_assignments')
                .update({ sergeant: null })
                .eq('id', assignment.id);
        }
    }
}

/**
 * Reassign a staff member from one courtroom to another.
 */
export async function reassignStaff(params: {
    staffName: string;
    role: StaffRole;
    fromRoomId: string;
    toRoomId: string;
}): Promise<void> {
    await removeStaffFromRoom(params.staffName, params.role, params.fromRoomId);
    await assignStaffToRoom(params.staffName, params.role, params.toRoomId);
}

/**
 * Mark a staff member as departed/inactive.
 * Removes them from all court_assignments.
 */
export async function departStaff(params: {
    personnelId: string;
    displayName: string;
    role: StaffRole;
}): Promise<void> {
    // 1. Mark as inactive in personnel_profiles
    await supabase
        .from('personnel_profiles')
        .update({
            is_active: false,
            is_available_for_assignment: false,
        })
        .eq('id', params.personnelId);

    // 2. Remove from all court_assignments
    if (params.role === 'clerk') {
        // Get all assignments that include this clerk
        const { data: assignments } = await supabase
            .from('court_assignments')
            .select('id, clerks')
            .not('clerks', 'is', null);

        if (assignments) {
            for (const assignment of assignments) {
                const clerks = (assignment.clerks as string[]) || [];
                if (clerks.includes(params.displayName)) {
                    await supabase
                        .from('court_assignments')
                        .update({ clerks: clerks.filter(c => c !== params.displayName) })
                        .eq('id', assignment.id);
                }
            }
        }
    } else {
        // Remove from sergeant field
        await supabase
            .from('court_assignments')
            .update({ sergeant: null })
            .eq('sergeant', params.displayName);
    }
}

/**
 * Promote a staff member — change their role.
 * e.g., clerk → sergeant, officer → sergeant
 */
export async function promoteStaff(params: {
    personnelId: string;
    displayName: string;
    oldRole: StaffRole;
    newRole: StaffRole;
}): Promise<void> {
    const titleMap: Record<StaffRole, string> = {
        clerk: 'Court Clerk',
        sergeant: 'Sergeant',
        officer: 'Court Officer',
    };

    // Update role in personnel_profiles
    await supabase
        .from('personnel_profiles')
        .update({
            primary_role: params.newRole,
            title: titleMap[params.newRole],
        })
        .eq('id', params.personnelId);

    // If changing from clerk to sergeant (or vice versa),
    // need to update court_assignments references
    if (params.oldRole === 'clerk' && (params.newRole === 'sergeant' || params.newRole === 'officer')) {
        // Remove from clerks arrays, could optionally add as sergeant
        const { data: assignments } = await supabase
            .from('court_assignments')
            .select('id, clerks')
            .not('clerks', 'is', null);

        if (assignments) {
            for (const assignment of assignments) {
                const clerks = (assignment.clerks as string[]) || [];
                if (clerks.includes(params.displayName)) {
                    await supabase
                        .from('court_assignments')
                        .update({ clerks: clerks.filter(c => c !== params.displayName) })
                        .eq('id', assignment.id);
                }
            }
        }
    } else if ((params.oldRole === 'sergeant' || params.oldRole === 'officer') && params.newRole === 'clerk') {
        // Remove from sergeant field
        await supabase
            .from('court_assignments')
            .update({ sergeant: null })
            .eq('sergeant', params.displayName);
    }
}

/**
 * Update a staff member's contact details.
 */
export async function updateStaffDetails(params: {
    personnelId: string;
    phone?: string | null;
    extension?: string | null;
}): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (params.phone !== undefined) updates.phone = params.phone;
    if (params.extension !== undefined) updates.extension = params.extension;

    if (Object.keys(updates).length > 0) {
        await supabase
            .from('personnel_profiles')
            .update(updates)
            .eq('id', params.personnelId);
    }
}
