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
 */
export function useStartTodaysReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ date, period, buildingCode }: StartReportParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const dateStr = format(date, 'yyyy-MM-dd');

            // 1. Get all court assignments with their room data
            const { data: assignments, error: assignError } = await supabase
                .from('court_assignments')
                .select('id, room_id, room_number, justice, part, clerks, sergeant, calendar_day, tel, fax');

            if (assignError) throw assignError;
            if (!assignments || assignments.length === 0) {
                throw new Error('No court assignments found. Set up assignments first.');
            }

            // 2. Get court_rooms mapping (room_id → court_room.id)
            const roomIds = [...new Set(assignments.map(a => a.room_id).filter(Boolean))];
            const { data: courtRooms, error: crError } = await supabase
                .from('court_rooms')
                .select('id, room_id, room_number, is_active')
                .in('room_id', roomIds);

            if (crError) throw crError;

            // Build room_id → court_room_id map
            const roomToCourtRoom = new Map(
                courtRooms?.filter(cr => cr.is_active !== false).map(cr => [cr.room_id, cr.id]) || []
            );

            // 3. Check for existing sessions to avoid duplicates
            const { data: existingSessions } = await supabase
                .from('court_sessions')
                .select('court_room_id')
                .eq('session_date', dateStr)
                .eq('period', period)
                .eq('building_code', buildingCode);

            const existingRoomIds = new Set(existingSessions?.map(s => s.court_room_id) || []);

            // 4. Build sessions from assignments
            const sessionsToInsert = [];
            const skipped = [];

            for (const assignment of assignments) {
                const courtRoomId = roomToCourtRoom.get(assignment.room_id);

                if (!courtRoomId) {
                    skipped.push(`Room ${assignment.room_number || assignment.room_id}: not found or inactive`);
                    continue;
                }

                if (existingRoomIds.has(courtRoomId)) {
                    skipped.push(`Part ${assignment.part || assignment.room_number}: already has a session`);
                    continue;
                }

                sessionsToInsert.push({
                    session_date: dateStr,
                    period,
                    building_code: buildingCode,
                    court_room_id: courtRoomId,
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

            // 5. Bulk insert
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
