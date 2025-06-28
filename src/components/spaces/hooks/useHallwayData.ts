
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
          floors:floors!hallways_floor_id_fkey (
            name,
            buildings:buildings!floors_building_id_fkey (
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

      // Initialize empty map for connected space names
      const connectedSpaceNames: Record<string, string> = {};

      // First check if there are any hallways and if they have space_connections
      if (hallwaysData && hallwaysData.length > 0) {
        // Type guard to check if space_connections exists and is an array
        const hasValidConnections = hallwaysData.some(h => 
          h.space_connections && 
          Array.isArray(h.space_connections) && 
          h.space_connections.length > 0
        );

        if (hasValidConnections) {
          // Gather all to_space_id from valid connections
          const spaceIds: string[] = [];
          
          for (const hallway of hallwaysData) {
            if (!hallway.space_connections || !Array.isArray(hallway.space_connections)) continue;
            
            for (const connection of hallway.space_connections) {
              // Check if connection is a valid object and has to_space_id
              if (connection && typeof connection === 'object' && 'to_space_id' in connection) {
                const toSpaceId = connection.to_space_id;
                if (typeof toSpaceId === 'string' && toSpaceId) {
                  spaceIds.push(toSpaceId);
                }
              }
            }
          }
          
          // Only fetch space names if we have valid IDs
          if (spaceIds.length > 0) {
            // Fetch room names in batch
            const { data: roomData } = await supabase
              .from('rooms')
              .select('id, name')
              .in('id', spaceIds);
              
            // Fetch hallway names in batch
            const { data: hallwayData } = await supabase
              .from('hallways')
              .select('id, name')
              .in('id', spaceIds);
              
            // Fetch door names in batch
            const { data: doorData } = await supabase
              .from('doors')
              .select('id, name')
              .in('id', spaceIds);
            
            // Combine all data into the connectedSpaceNames map
            if (roomData) roomData.forEach(room => { if (room.id) connectedSpaceNames[room.id] = room.name; });
            if (hallwayData) hallwayData.forEach(hall => { if (hall.id) connectedSpaceNames[hall.id] = hall.name; });
            if (doorData) doorData.forEach(door => { if (door.id) connectedSpaceNames[door.id] = door.name; });
          }
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

        // Transform space connections to include the correct connected space name with type guards
        const transformedConnections: HallwayConnection[] = [];
        
        if (hallway.space_connections && Array.isArray(hallway.space_connections)) {
          for (const conn of hallway.space_connections) {
            // Ensure connection is a valid object
            if (!conn || typeof conn !== 'object') continue;
            
            // Check if required properties exist using type guards
            if (!('id' in conn)) continue;
            
            const toSpaceId = 'to_space_id' in conn ? conn.to_space_id as string : undefined;
            const spaceName = toSpaceId && toSpaceId in connectedSpaceNames 
              ? connectedSpaceNames[toSpaceId] 
              : 'Unknown Space';
              
            transformedConnections.push({
              id: conn.id as string,
              position: 'position' in conn ? conn.position as string : '',
              connection_type: 'connection_type' in conn ? conn.connection_type as string : '',
              door_details: 'door_details' in conn ? conn.door_details as Record<string, any> : undefined,
              access_requirements: 'access_requirements' in conn ? conn.access_requirements as Record<string, any> : undefined,
              is_emergency_exit: 'is_emergency_exit' in conn ? !!conn.is_emergency_exit : false,
              to_space: {
                name: spaceName
              }
            });
          }
        }

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
