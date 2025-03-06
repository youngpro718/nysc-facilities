
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";
import { toast } from "sonner";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  try {
    if (data.type === 'room') {
      const roomData = {
        name: data.name,
        room_number: data.roomNumber,
        room_type: data.roomType as RoomTypeEnum,
        status: data.status,
        floor_id: data.floorId,
        description: data.description,
        phone_number: data.phoneNumber,
        current_function: data.currentFunction,
        is_storage: data.isStorage || false,
        storage_type: data.isStorage ? data.storageType as StorageTypeEnum : null,
        storage_capacity: data.storageCapacity,
        parent_room_id: data.parentRoomId,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 150, height: 100 },
        rotation: data.rotation || 0
      };

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([roomData])
        .select()
        .single();

      if (roomError) throw roomError;
      return room;
    }

    // Custom handling for hallways with appropriate properties and dimensions
    if (data.type === 'hallway') {
      console.log('Creating hallway with data:', {
        name: data.name,
        type: data.type,
        section: data.section,
        hallwayType: data.hallwayType,
        trafficFlow: data.trafficFlow,
        accessibility: data.accessibility,
        emergencyRoute: data.emergencyRoute,
        maintenancePriority: data.maintenancePriority,
        capacityLimit: data.capacityLimit
      });
      
      // Step 1: Create the base hallway in new_spaces table
      const hallwayData = {
        name: data.name,
        type: data.type,
        floor_id: data.floorId,
        status: data.status,
        // Use hallway-specific dimensions (longer and thinner)
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 300, height: 50 },
        rotation: data.rotation || 0,
        // Store minimal properties in the properties field
        properties: {
          description: data.description
        }
      };

      const { data: hallway, error: hallwayError } = await supabase
        .from('new_spaces')
        .insert([hallwayData])
        .select()
        .single();

      if (hallwayError) {
        console.error('Error creating hallway:', hallwayError);
        throw hallwayError;
      }

      console.log('Created hallway in new_spaces:', hallway);

      // Step 2: Create hallway properties in the specialized table
      const hallwayPropsData = {
        space_id: hallway.id,
        section: data.section || 'connector',
        traffic_flow: (data.trafficFlow || 'two_way') as 'two_way' | 'one_way' | 'restricted',
        accessibility: (data.accessibility || 'fully_accessible') as 'fully_accessible' | 'limited_access' | 'stairs_only' | 'restricted',
        emergency_route: (data.emergencyRoute || 'not_designated') as 'primary' | 'secondary' | 'not_designated',
        maintenance_priority: data.maintenancePriority || 'low',
        capacity_limit: data.capacityLimit
      };

      const { data: propsData, error: propsError } = await supabase
        .from('hallway_properties')
        .insert([hallwayPropsData])
        .select();

      if (propsError) {
        console.error('Error saving hallway properties:', propsError);
        // Don't throw here, proceed with connections if possible
      } else {
        console.log('Created hallway properties:', propsData);
      }

      // Step 3: Create connections if available
      if (data.connections && data.connections.length > 0) {
        const firstConnection = data.connections[0]; // Get the first connection

        if (firstConnection && firstConnection.toSpaceId && firstConnection.connectionType) {
          const hallwayConnectionData = {
            from_space_id: hallway.id,
            to_space_id: firstConnection.toSpaceId,
            space_type: data.type,
            connection_type: firstConnection.connectionType,
            direction: firstConnection.direction || 'adjacent',
            status: data.status as 'active' | 'inactive' | 'under_maintenance',
            connection_status: 'active',
            // Add hallway-specific connection data
            hallway_position: 0.5, // Default to middle (0-1 range)
            offset_distance: 50,   // Default offset from hallway
            position: firstConnection.direction === 'north' || firstConnection.direction === 'south' ? 'vertical' : 'horizontal'
          };

          console.log('Creating connection with data:', hallwayConnectionData);

          const { data: connectionData, error: connectionError } = await supabase
            .from('space_connections')
            .insert([hallwayConnectionData])
            .select();

          if (connectionError) {
            console.error('Connection error:', connectionError);
            toast.error(`Space created but connection failed: ${connectionError.message}`);
          } else {
            console.log('Created space connection:', connectionData);
          }
        }
      }

      return hallway;
    }

    // Handle other space types (doors) using new_spaces table
    const spaceData = {
      name: data.name,
      type: data.type,
      floor_id: data.floorId,
      status: data.status,
      position: data.position || { x: 0, y: 0 },
      size: data.type === 'door' ? 
        { width: 60, height: 20 } : 
        { width: 150, height: 100 },
      rotation: data.rotation || 0
    };

    const { data: space, error: spaceError } = await supabase
      .from('new_spaces')
      .insert([spaceData])
      .select()
      .single();

    if (spaceError) throw spaceError;

    // Create connections if available
    if (data.connections && data.connections.length > 0) {
      const firstConnection = data.connections[0]; // Get the first connection

      if (firstConnection && firstConnection.toSpaceId && firstConnection.connectionType) {
        const spaceConnectionData = {
          from_space_id: space.id,
          to_space_id: firstConnection.toSpaceId,
          space_type: data.type,
          connection_type: firstConnection.connectionType,
          direction: firstConnection.direction || 'adjacent',
          status: data.status as 'active' | 'inactive' | 'under_maintenance',
          connection_status: 'active'
        };

        console.log('Creating connection with data:', spaceConnectionData);

        const { error: connectionError } = await supabase
          .from('space_connections')
          .insert([spaceConnectionData]);

        if (connectionError) {
          console.error('Connection error:', connectionError);
          toast.error(`Space created but connection failed: ${connectionError.message}`);
        }
      }
    }

    return space;
  } catch (error) {
    console.error('Error in createSpace:', error);
    throw error;
  }
}
