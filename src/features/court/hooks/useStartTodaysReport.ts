import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SessionPeriod, BuildingCode } from '@/types/courtSessions';

interface StartReportParams {
    date: Date;
    period: SessionPeriod;
    buildingCode: BuildingCode;
}

/**
 * Hook to auto-generate session rows from court_assignments.
 * 
 * Queries all active court assignments, maps them to court_rooms,
 * and creates a session for each with pre-filled judge, part, clerk,
 * and sergeant data. Skips rooms that already have sessions.
 * 
 * Now filters assignments by building so 100 and 111 Centre Street
 * each get only their own rooms.
 */
export function useStartTodaysReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ date, period, buildingCode }: StartReportParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const dateStr = format(date, 'yyyy-MM-dd');

            // 1. Resolve building ID from building code
            const buildingName = buildingCode === '100' 
                ? '100 Centre Street Supreme Court' 
                : '111 Centre Street Supreme Court';

            const { data: building, error: buildingError } = await supabase
                .from('buildings')
                .select('id')
                .eq('name', buildingName)
                .single();

            if (buildingError) {
                logger.error('Building lookup failed:', buildingError);
                throw new Error(`Building "${buildingName}" not found. Check buildings table.`);
            }

            // 2. Get court rooms for THIS building only (court_rooms → rooms → floors → buildings)
            const { data: courtRooms, error: crError } = await supabase
                .from('court_rooms')
                .select(`
                    id, 
                    room_id, 
                    room_number, 
                    is_active,
                    rooms!inner(
                        floor_id,
                        floors!inner(
                            building_id
                        )
                    )
                `)
                .eq('is_active', true)
                .eq('rooms.floors.building_id', building.id);

            if (crError) throw crError;
            if (!courtRooms || courtRooms.length === 0) {
                throw new Error(`No active court rooms found for ${buildingName}.`);
            }

            // Build room_id → court_room record map
            const roomIdToCourtRoom = new Map(
                courtRooms.map(cr => [cr.room_id, cr])
            );

            // 3. Get all court assignments that match rooms in this building
            const roomIds = [...roomIdToCourtRoom.keys()];
            const { data: assignments, error: assignError } = await supabase
                .from('court_assignments')
                .select('id, room_id, room_number, justice, part, clerks, sergeant, calendar_day, tel, fax')
                .in('room_id', roomIds);

            if (assignError) throw assignError;
            if (!assignments || assignments.length === 0) {
                throw new Error(`No court assignments found for ${buildingName}. Set up assignments first.`);
            }

            // 4. Check for existing sessions to avoid duplicates
            const courtRoomIds = courtRooms.map(cr => cr.id);
            const { data: existingSessions } = await supabase
                .from('court_sessions')
                .select('court_room_id')
                .eq('session_date', dateStr)
                .eq('period', period)
                .eq('building_code', buildingCode)
                .in('court_room_id', courtRoomIds);

            const existingRoomIds = new Set(existingSessions?.map(s => s.court_room_id) || []);

            // 5. Build sessions from assignments
            const sessionsToInsert = [];
            const skipped = [];

            for (const assignment of assignments) {
                const courtRoom = roomIdToCourtRoom.get(assignment.room_id);

                if (!courtRoom) {
                    skipped.push(`Room ${assignment.room_number || assignment.room_id}: not in this building`);
                    continue;
                }

                if (existingRoomIds.has(courtRoom.id)) {
                    skipped.push(`Part ${assignment.part || assignment.room_number}: already has a session`);
                    continue;
                }

                sessionsToInsert.push({
                    session_date: dateStr,
                    period,
                    building_code: buildingCode,
                    court_room_id: courtRoom.id,
                    assignment_id: assignment.id,
                    part_number: assignment.part || null,
                    judge_name: assignment.justice || null,
                    clerk_names: assignment.clerks || null,
                    sergeant_name: assignment.sergeant || null,
                    calendar_day: assignment.calendar_day || null,
                    status: 'scheduled',
                    created_by: user.id,
                });
            }

            if (sessionsToInsert.length === 0) {
                if (skipped.length > 0) {
                    throw new Error(`All ${skipped.length} assignments already have sessions for this date/period.`);
                }
                throw new Error('No valid assignments to create sessions from.');
            }

            // 6. Bulk insert
            const { data, error } = await supabase
                .from('court_sessions')
                .insert(sessionsToInsert)
                .select();

            if (error) throw error;

            return {
                inserted: data?.length || 0,
                skipped: skipped.length,
                total: assignments.length,
            };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['court-operations'] });

            const msg = `Created ${result.inserted} sessions from ${result.total} assignments`;
            if (result.skipped > 0) {
                toast.success(msg, {
                    description: `${result.skipped} skipped (already exist or inactive)`,
                });
            } else {
                toast.success(msg);
            }
        },
        onError: (error) => {
            logger.error('Error starting report:', error);
            toast.error('Failed to start report', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });
}
