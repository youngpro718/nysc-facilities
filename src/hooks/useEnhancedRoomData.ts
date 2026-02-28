// Enhanced Room Data — enriched room queries with lighting/occupant data
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { EnhancedRoom, LightingFixtureStatus } from "@/components/spaces/rooms/types/EnhancedRoomTypes";

// Safely parse JSON-like inputs (string or object). Returns null on error.
function safeJsonParse<T = any>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as T;
  }
  return null;
}

export function useEnhancedRoomData(roomId: string) {
  return useQuery({
    queryKey: ['enhanced-room', roomId],
    queryFn: async (): Promise<EnhancedRoom | null> => {
      // Try optimized RPC to reduce round trips (room + issues + court data)
      let room: Record<string, unknown> = null;
      let issues: unknown[] | null = null;
      let courtRoomData: Record<string, unknown> = null;
      let courtAssignment: { id: string } | null = null;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_enhanced_room', { p_room_id: roomId });
        if (rpcError) throw rpcError;
        if (rpcData) {
          room = (rpcData as any).room;
          issues = (rpcData as any).issues ?? [];
          courtRoomData = (rpcData as any).court_room ?? null;
          courtAssignment = (rpcData as any).court_assignment ?? null;
        }
      } catch (e) {
        logger.warn('RPC get_enhanced_room failed, falling back to separate queries', { roomId, error: e });
        // Fallback: Get base room data
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select(`
            *,
            floor:floors(
              id,
              name,
              building:buildings!floors_building_id_fkey(
                id,
                name
              )
            ),
            current_occupants:occupant_room_assignments!occupant_room_assignments_room_id_fkey(
              occupant:occupants!occupant_room_assignments_occupant_id_fkey(
                id,
                first_name,
                last_name
              ),
              assignment_type,
              is_primary
            )
          `)
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) {
          logger.error('Error fetching room:', roomError);
          return null;
        }
        room = roomData;

        // Separate issues query (kept separate to avoid reverse relationship cache issues)
        const { data: issuesData, error: issuesError } = await supabase
          .from('issues')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            created_at
          `)
          .eq('room_id', roomId);
        if (issuesError) {
          logger.error('Failed to load issues for room', { roomId, error: issuesError });
        }
        issues = issuesData ?? [];

        // Get courtroom data if applicable
        if (room.room_type === 'courtroom') {
          const { data: courtRoom } = await supabase
            .from('court_rooms')
            .select('*')
            .eq('room_id', roomId)
            .single();
          courtRoomData = courtRoom;
  
          const { data: assignment } = await supabase
            .from('court_assignments')
            .select('id')
            .eq('room_id', roomId)
            .maybeSingle();
          courtAssignment = assignment;
        }
      }

      // If no room data could be loaded via RPC or fallback, exit early to avoid null dereferences
      if (!room) {
        logger.warn('Enhanced room data unavailable after RPC/fallback', { roomId });
        return null;
      }

      // Get lighting fixtures data
      const { data: lightingFixtures } = await supabase
        .from('lighting_fixtures')
        .select('*')
        .eq('space_type', 'room')
        .eq('space_id', roomId);

      // Calculate lighting status
      const totalFixtures = lightingFixtures?.length || 0;
      const functionalFixtures = lightingFixtures?.filter(f => f.status === 'functional').length || 0;
      const lightingPercentage = totalFixtures > 0 ? Math.round((functionalFixtures / totalFixtures) * 100) : 100;

      // Calculate room size category using the database function and actual room size data
      let roomSizeCategory: 'small' | 'medium' | 'large' = 'medium';
      if (room.size) {
        const sizeData = safeJsonParse<Record<string, unknown>>(room.size);
        if (sizeData) {
          const { data: sizeResult } = await supabase
            .rpc('get_room_size_from_data', { room_size_data: sizeData });
          roomSizeCategory = (sizeResult as 'small' | 'medium' | 'large') || 'medium';
        }
      }

      // Check for persistent issues
      const safeIssues = Array.isArray(issues) ? issues : [];
      const openIssues = safeIssues.filter((issue: any) => ['open', 'in_progress'].includes(issue.status));
      const hasPersistentIssues = openIssues.length >= 3;

      // Calculate vacancy status
      const occupantCount = (room as any).current_occupants?.length || 0;
      let vacancyStatus: 'vacant' | 'occupied' | 'at_capacity' = 'vacant';
      if (room.room_type === 'courtroom') {
        // Courtrooms are considered occupied if they have an assignment and the courtroom is active
        const hasAssignment = !!courtAssignment?.id;
        const isActiveCourtRoom = (courtRoomData as any)?.is_active !== false;
        vacancyStatus = hasAssignment && isActiveCourtRoom ? 'occupied' : 'vacant';
      } else {
        if (occupantCount > 0) {
          vacancyStatus = 'occupied';
        }
      }

      // Transform lighting fixtures with outage duration
      const enhancedLightingFixtures: LightingFixtureStatus[] = lightingFixtures?.map(fixture => ({
        id: fixture.id,
        room_id: roomId,
        fixture_name: fixture.name || 'Unknown',
        location: fixture.position || 'General Area',
        status: fixture.status as 'functional' | 'out' | 'flickering' | 'maintenance',
        reported_out_date: fixture.reported_out_date,
        ballast_issue: fixture.ballast_issue || false,
        last_serviced: fixture.replaced_date,
        outage_duration_days: fixture.reported_out_date 
          ? Math.floor((Date.now() - new Date(fixture.reported_out_date).getTime()) / (1000 * 60 * 60 * 24))
          : undefined
      })) || [];

      // Build history stats
      // 1) Total issues and last issue date
      const totalIssues = safeIssues.length || 0;
      const lastIssueDate = safeIssues.length > 0
        ? safeIssues.map((i: any) => new Date(i.created_at).getTime())
            .reduce((a: number, b: number) => Math.max(a, b), 0)
        : undefined;

      // 2) Unique occupants who have been in the room historically
      const { data: occHistory } = await supabase
        .from('occupant_room_assignments')
        .select('occupant_id')
        .eq('room_id', roomId);
      const uniqueOccupants = Array.isArray(occHistory)
        ? new Set(occHistory.map((o: any) => o.occupant_id)).size
        : 0;

      // Construct enhanced room object
      const enhancedRoom: EnhancedRoom = {
        ...(room as any),
        room_type: room.room_type as any,
        status: room.status as any,
        storage_type: room.storage_type as any,
        simplified_storage_type: room.simplified_storage_type as any,
        position: room.position ? (safeJsonParse<any>(room.position) ?? undefined) : undefined,
        size: room.size ? (safeJsonParse<any>(room.size) ?? undefined) : undefined,
        courtroom_photos: room.courtroom_photos ? (safeJsonParse<any>(room.courtroom_photos) ?? undefined) : undefined,
        court_room: courtRoomData as any,
        lighting_fixtures: enhancedLightingFixtures,
        total_fixtures_count: totalFixtures,
        functional_fixtures_count: functionalFixtures,
        lighting_percentage: lightingPercentage,
        has_lighting_issues: functionalFixtures < totalFixtures,
        room_size_category: roomSizeCategory,
        has_persistent_issues: hasPersistentIssues,
        vacancy_status: vacancyStatus,
        persistent_issues: hasPersistentIssues ? {
          room_id: roomId,
          issue_count: safeIssues.length || 0,
          open_issues: openIssues.length,
          latest_issue_date: (openIssues[0] as any)?.created_at || new Date().toISOString()
        } : undefined,
        history_stats: {
          total_issues: totalIssues,
          unique_occupants: uniqueOccupants,
          current_occupants: occupantCount,
          last_issue_date: lastIssueDate ? new Date(lastIssueDate).toISOString() : undefined,
        }
      };

      return enhancedRoom;
    },
    enabled: !!roomId,
  });
}