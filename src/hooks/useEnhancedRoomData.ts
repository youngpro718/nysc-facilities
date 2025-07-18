import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedRoom, LightingFixtureStatus } from "@/components/spaces/rooms/types/EnhancedRoomTypes";

export function useEnhancedRoomData(roomId: string) {
  return useQuery({
    queryKey: ['enhanced-room', roomId],
    queryFn: async (): Promise<EnhancedRoom | null> => {
      // Get base room data
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          floor:floors(
            id,
            name,
            building:buildings(
              id,
              name
            )
          ),
          issues(
            id,
            title,
            description,
            status,
            priority,
            created_at
          ),
          current_occupants:occupant_room_assignments!occupant_room_assignments_room_id_fkey(
            occupant:occupants(
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

      if (roomError || !room) {
        console.error('Error fetching room:', roomError);
        return null;
      }

      // Get courtroom data if applicable
      let courtRoomData = null;
      if (room.room_type === 'courtroom') {
        const { data: courtRoom } = await supabase
          .from('court_rooms')
          .select('*')
          .eq('room_id', roomId)
          .single();
        
        courtRoomData = courtRoom;
      }

      // Get lighting fixtures data
      const { data: lightingFixtures } = await supabase
        .from('lighting_fixtures')
        .select('*')
        .eq('room_id', roomId);

      // Calculate lighting status
      const totalFixtures = lightingFixtures?.length || 0;
      const functionalFixtures = lightingFixtures?.filter(f => f.status === 'functional').length || 0;
      const lightingPercentage = totalFixtures > 0 ? Math.round((functionalFixtures / totalFixtures) * 100) : 100;

      // Calculate room size category using the database function and actual room size data
      let roomSizeCategory: 'small' | 'medium' | 'large' = 'medium';
      if (room.size) {
        // Use the database function to get accurate size category
        const sizeData = typeof room.size === 'string' ? JSON.parse(room.size) : room.size;
        const { data: sizeResult } = await supabase
          .rpc('get_room_size_from_data', { room_size_data: sizeData });
        roomSizeCategory = (sizeResult as 'small' | 'medium' | 'large') || 'medium';
      }

      // Check for persistent issues
      const openIssues = room.issues?.filter((issue: any) => ['open', 'in_progress'].includes(issue.status)) || [];
      const hasPersistentIssues = openIssues.length >= 3;

      // Calculate vacancy status
      const occupantCount = room.current_occupants?.length || 0;
      let vacancyStatus: 'vacant' | 'occupied' | 'at_capacity' = 'vacant';
      if (occupantCount > 0) {
        vacancyStatus = 'occupied';
      }

      // Transform lighting fixtures with outage duration
      const enhancedLightingFixtures: LightingFixtureStatus[] = lightingFixtures?.map(fixture => ({
        id: fixture.id,
        room_id: fixture.room_id,
        fixture_name: fixture.name || 'Unknown',
        location: fixture.room_number || fixture.position || 'General Area',
        status: fixture.status as 'functional' | 'out' | 'flickering' | 'maintenance',
        reported_out_date: fixture.reported_out_date,
        ballast_issue: fixture.ballast_issue || false,
        last_serviced: fixture.last_maintenance_date,
        outage_duration_days: fixture.reported_out_date 
          ? Math.floor((Date.now() - new Date(fixture.reported_out_date).getTime()) / (1000 * 60 * 60 * 24))
          : undefined
      })) || [];

      // Construct enhanced room object
      const enhancedRoom: EnhancedRoom = {
        ...room,
        room_type: room.room_type as any,
        status: room.status as any,
        storage_type: room.storage_type as any,
        position: room.position ? (typeof room.position === 'string' ? JSON.parse(room.position) : room.position) : undefined,
        size: room.size ? (typeof room.size === 'string' ? JSON.parse(room.size) : room.size) : undefined,
        courtroom_photos: room.courtroom_photos ? (typeof room.courtroom_photos === 'string' ? JSON.parse(room.courtroom_photos) : room.courtroom_photos) : undefined,
        court_room: courtRoomData,
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
          issue_count: room.issues?.length || 0,
          open_issues: openIssues.length,
          latest_issue_date: openIssues[0]?.created_at || new Date().toISOString()
        } : undefined
      };

      return enhancedRoom;
    },
    enabled: !!roomId,
  });
}