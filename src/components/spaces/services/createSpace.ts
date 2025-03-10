import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum, roomTypeToString, statusToString, storageTypeToString } from "../rooms/types/roomEnums";
import { toast } from "sonner";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  try {
    if (data.type === 'room') {
      const roomData = {
        name: data.name,
        room_number: data.roomNumber,
        room_type: roomTypeToString(data.roomType),
        status: statusToString(data.status),
        floor_id: data.floorId,
        description: data.description,
        phone_number: data.phoneNumber,
        current_function: data.currentFunction,
        is_storage: data.isStorage || false,
        storage_type: data.isStorage ? storageTypeToString(data.storageType) : null,
        storage_capacity: data.storageCapacity,
        parent_room_id: data.parentRoomId,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 150, height: 100 },
        rotation: data.rotation || 0,
        courtroom_photos: data.roomType === RoomTypeEnum.COURTROOM ? 
          { judge_view: null, audience_view: null } : null
      };

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) throw roomError;
      return room;
    }

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
      
      const hallwayData = {
        name: data.name,
        type: data.type,
        floor_id: data.floorId,
        status: data.status,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 300, height: 50 },
        rotation: data.rotation || 0,
        properties: {
          description: data.description,
          section: data.section || 'connector',
          hallwayType: data.hallwayType || 'public_main',
          trafficFlow: data.trafficFlow || 'two_way',
          accessibility: data.accessibility || 'fully_accessible'
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
      } else {
        console.log('Created hallway properties:', propsData);
      }

      if (data.connections && data.connections.length > 0) {
        const firstConnection = data.connections[0];

        if (firstConnection && firstConnection.toSpaceId && firstConnection.connectionType) {
          const { data: targetSpaceData } = await supabase
            .from('new_spaces')
            .select('type')
            .eq('id', firstConnection.toSpaceId)
            .single();
            
          const isTransitionDoor = firstConnection.connectionType === 'transition' || 
                                  (targetSpaceData?.type === 'hallway' && firstConnection.connectionType === 'door');
          
          // Convert the direction to a valid value for the database constraint
          let directionValue = validateDirection(firstConnection.direction);
          
          const hallwayConnectionData = {
            from_space_id: hallway.id,
            to_space_id: firstConnection.toSpaceId,
            space_type: data.type,
            connection_type: firstConnection.connectionType,
            direction: directionValue,
            status: data.status as 'active' | 'inactive' | 'under_maintenance',
            connection_status: 'active',
            hallway_position: getHallwayPosition(firstConnection.direction),
            offset_distance: 50,
            position: getPositionFromDirection(firstConnection.direction),
            is_transition_door: isTransitionDoor
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

    if (data.connections && data.connections.length > 0) {
      const firstConnection = data.connections[0];

      if (firstConnection && firstConnection.toSpaceId && firstConnection.connectionType) {
        const { data: fromSpaceData } = await supabase
          .from('new_spaces')
          .select('type')
          .eq('id', space.id)
          .single();
          
        const { data: targetSpaceData } = await supabase
          .from('new_spaces')
          .select('type')
          .eq('id', firstConnection.toSpaceId)
          .single();
          
        const isTransitionDoor = firstConnection.connectionType === 'transition' || 
                                (fromSpaceData?.type === 'hallway' && targetSpaceData?.type === 'hallway');
        
        // Convert the direction to a valid value for the database constraint
        let directionValue = validateDirection(firstConnection.direction);
        
        const spaceConnectionData = {
          from_space_id: space.id,
          to_space_id: firstConnection.toSpaceId,
          space_type: data.type,
          connection_type: firstConnection.connectionType,
          direction: directionValue,
          status: data.status as 'active' | 'inactive' | 'under_maintenance',
          connection_status: 'active',
          is_transition_door: isTransitionDoor,
          hallway_position: getHallwayPosition(firstConnection.direction),
          position: getPositionFromDirection(firstConnection.direction)
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

function validateDirection(direction: string | undefined): string {
  if (!direction) return 'adjacent';
  
  const validDirections = ['start', 'end', 'center', 'left', 'right', 'adjacent'];
  
  if (validDirections.includes(direction)) {
    return direction;
  }
  
  return 'adjacent';
}

function getHallwayPosition(direction: string | undefined): number {
  if (!direction) return 0.5;
  
  switch (direction) {
    case 'start': return 0.1;
    case 'end': return 0.9;
    case 'center': return 0.5;
    case 'left': return 0.3;
    case 'right': return 0.7;
    default: return 0.5;
  }
}

function getPositionFromDirection(direction: string | undefined): string | undefined {
  if (!direction) return undefined;
  
  if (direction === 'start' || direction === 'end' || 
      direction === 'center') {
    return 'longitudinal';
  } else if (direction === 'left' || direction === 'right') {
    return 'lateral';
  }
  
  return undefined;
}
