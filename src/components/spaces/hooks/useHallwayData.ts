
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Hallway, HallwayConnection, EmergencyExit, MaintenanceSchedule, UsageStatistics } from "../types/hallwayTypes";

interface UseHallwayDataProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export const useHallwayData = ({ selectedBuilding, selectedFloor }: UseHallwayDataProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hallways, isLoading } = useQuery({
    queryKey: ['hallways', selectedBuilding, selectedFloor],
    queryFn: async () => {
      console.log("Fetching hallways with filters:", { selectedBuilding, selectedFloor });
      
      let query = supabase
        .from('hallways')
        .select(`
          *,
          floors:floor_id (
            name,
            buildings:building_id (
              name
            )
          ),
          space_connections!from_space_id (
            id,
            position,
            connection_type,
            door_details,
            access_requirements,
            is_emergency_exit,
            to_space_id,
            space_type
          )
        `);

      // Apply filters
      if (selectedFloor !== 'all') {
        query = query.eq('floor_id', selectedFloor);
      }
      
      if (selectedBuilding !== 'all') {
        query = query.eq('floors.buildings.id', selectedBuilding);
      }

      const { data: hallwaysData, error: hallwaysError } = await query;

      if (hallwaysError) {
        console.error('Error fetching hallways:', hallwaysError);
        toast({
          title: "Error",
          description: "Failed to fetch hallways. Please try again.",
          variant: "destructive",
        });
        throw hallwaysError;
      }

      // Fetch connected space names in a separate query
      const spaceConnections = hallwaysData?.flatMap(h => h.space_connections) || [];
      const connectedSpaceNames: Record<string, string> = {};

      for (const connection of spaceConnections) {
        if (!connection.to_space_id) continue;

        const { data, error } = await supabase
          .from(connection.space_type === 'room' ? 'rooms' : 
                connection.space_type === 'hallway' ? 'hallways' : 'doors')
          .select('name')
          .eq('id', connection.to_space_id)
          .single();

        if (!error && data) {
          connectedSpaceNames[connection.to_space_id] = data.name;
        }
      }

      // Transform and type the response data
      const transformedHallways: Hallway[] = (hallwaysData || []).map(hallway => {
        // Cast emergency_exits with type assertion
        const emergencyExits = (hallway.emergency_exits as any[] || []).map((exit): EmergencyExit => ({
          location: exit.location || '',
          type: exit.type || '',
          notes: exit.notes
        }));

        // Cast maintenance_schedule with type assertion
        const maintenanceSchedule = (hallway.maintenance_schedule as any[] || []).map((schedule): MaintenanceSchedule => ({
          date: schedule.date || '',
          type: schedule.type || '',
          status: schedule.status || '',
          assigned_to: schedule.assigned_to
        }));

        // Cast usage_statistics with type assertion
        const usageStats: UsageStatistics = {
          daily_traffic: (hallway.usage_statistics as any)?.daily_traffic || 0,
          peak_hours: (hallway.usage_statistics as any)?.peak_hours || [],
          last_updated: (hallway.usage_statistics as any)?.last_updated || null
        };

        // Transform space connections to include the correct connected space name
        const transformedConnections: HallwayConnection[] = ((hallway.space_connections || []) as any[]).map(conn => ({
          id: conn.id,
          position: conn.position,
          connection_type: conn.connection_type,
          door_details: conn.door_details,
          access_requirements: conn.access_requirements,
          is_emergency_exit: conn.is_emergency_exit,
          to_space: {
            name: connectedSpaceNames[conn.to_space_id] || 'Unknown Space'
          }
        }));

        return {
          ...hallway,
          type: hallway.type as Hallway['type'],
          status: hallway.status as Hallway['status'],
          section: hallway.section as Hallway['section'],
          traffic_flow: hallway.traffic_flow as Hallway['traffic_flow'],
          accessibility: hallway.accessibility as Hallway['accessibility'],
          emergency_route: hallway.emergency_route as Hallway['emergency_route'],
          emergency_exits: emergencyExits,
          maintenance_schedule: maintenanceSchedule,
          usage_statistics: usageStats,
          space_connections: transformedConnections,
          floors: hallway.floors ? {
            name: hallway.floors.name,
            buildings: hallway.floors.buildings ? {
              name: hallway.floors.buildings.name
            } : undefined
          } : undefined
        };
      });

      return transformedHallways;
    },
    enabled: true
  });

  const deleteHallway = useMutation({
    mutationFn: async (hallwayId: string) => {
      const { error } = await supabase
        .from('hallways')
        .delete()
        .eq('id', hallwayId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallways'] });
      toast({
        title: "Success",
        description: "Hallway has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete hallway. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting hallway:', error);
    },
  });

  return {
    hallways,
    isLoading,
    deleteHallway
  };
};
