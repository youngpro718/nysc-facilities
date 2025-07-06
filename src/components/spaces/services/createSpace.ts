
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { 
  RoomTypeEnum, 
  StorageTypeEnum, 
  roomTypeToString, 
  storageTypeToString 
} from "../rooms/types/roomEnums";
import { toast } from "sonner";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  try {
    if (data.type === 'room') {
      // Map the enum to the correct database value
      let dbRoomType = data.roomType ? roomTypeToString(data.roomType as RoomTypeEnum) : 'office';
      
      // Ensure the room type matches database enum values
      const validRoomTypes = [
        'office', 'courtroom', 'chamber', 'male_locker_room', 
        'female_locker_room', 'filing_room'
      ];
      
      if (!validRoomTypes.includes(dbRoomType)) {
        dbRoomType = 'office'; // Default fallback
      }
      
      const roomData = {
        name: data.name,
        room_number: data.roomNumber || null,
        room_type: dbRoomType as any, // Cast to avoid type issues
        floor_id: data.floorId,
        status: 'active',
        description: data.description || null,
        phone_number: data.phoneNumber || null,
        current_function: data.currentFunction || null,
        // Always include is_storage flag; default to false
        is_storage: !!data.isStorage,
        // Include storage_type only when is_storage is true and a type is provided
        ...(data.isStorage && data.storageType ? { 
          storage_type: storageTypeToString(data.storageType as StorageTypeEnum) 
        } : {}),
        storage_capacity: data.storageCapacity || null,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 150, height: 100 },
        rotation: data.rotation || 0,
        courtroom_photos: data.roomType === RoomTypeEnum.COURTROOM ? 
          (data.courtRoomPhotos || { judge_view: null, audience_view: null }) : null,
        status: 'active' as any // Cast to match enum
      };

      console.log('Inserting room data:', roomData);

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        if ((roomError as any).code === '23505') {
          toast.error('Room number already exists. Please use a unique room number.');
        }
        console.error('Room creation error:', roomError);
        throw new Error(`Failed to create room: ${roomError.message}`);
      }

      console.log('Room created successfully:', room);
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
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 300, height: 50 },
        rotation: data.rotation || 0,
        description: data.description || null,
        status: 'active' as any // Cast to match enum
      };

      const { data: hallway, error: hallwayError } = await supabase
        .from('new_spaces')
        .insert(hallwayData)
        .select()
        .single();

      if (hallwayError) {
        console.error('Error creating hallway:', hallwayError);
        throw new Error(`Failed to create hallway: ${hallwayError.message}`);
      }

      console.log('Created hallway in new_spaces:', hallway);

      // Create hallway properties
      const hallwayPropsData = {
        space_id: hallway.id,
        section: data.section || 'connector',
        traffic_flow: (data.trafficFlow || 'two_way') as 'two_way' | 'one_way' | 'restricted',
        accessibility: (data.accessibility || 'fully_accessible') as 'fully_accessible' | 'limited_access' | 'stairs_only' | 'restricted',
        emergency_route: (data.emergencyRoute || 'not_designated') as 'primary' | 'secondary' | 'not_designated',
        maintenance_priority: data.maintenancePriority || 'low',
        capacity_limit: data.capacityLimit
      };

      const { error: propsError } = await supabase
        .from('hallway_properties')
        .insert(hallwayPropsData);

      if (propsError) {
        console.error('Error saving hallway properties:', propsError);
      } else {
        console.log('Created hallway properties:', hallwayPropsData);
      }

      if (data.connections && data.connections.length > 0) {
        const firstConnection = data.connections[0];

        if (firstConnection && firstConnection.toSpaceId && firstConnection.connectionType) {
          const { data: targetSpaceData } = await supabase
            .from('new_spaces')
            .select('type')
            .eq('id', firstConnection.toSpaceId)
            .single();
            
          const isTransitionDoor = firstConnection.connectionType === 'door' && 
                                  targetSpaceData?.type === 'hallway';
          
          let directionValue = validateDirection(firstConnection.direction);
          
          const hallwayConnectionData = {
            from_space_id: hallway.id,
            to_space_id: firstConnection.toSpaceId,
            space_type: data.type,
            connection_type: firstConnection.connectionType,
            direction: directionValue,
            connection_status: 'active',
            hallway_position: getHallwayPosition(firstConnection.direction),
            offset_distance: 50,
            position: getPositionFromDirection(firstConnection.direction),
            is_transition_door: isTransitionDoor
          };

          console.log('Creating connection with data:', hallwayConnectionData);

          // Space connections feature removed - skip inserting connections
          let connectionError = null;

          if (connectionError) {
            console.error('Connection error:', connectionError);
            toast.error(`Space created but connection failed: ${connectionError.message}`);
          } else {
            console.log('Created space connection');
          }
        }
      }

      return hallway;
    }

    // For doors and other space types
    const spaceData = {
      name: data.name,
      type: data.type,
      floor_id: data.floorId,
      position: data.position || { x: 0, y: 0 },
      size: data.type === 'door' ? 
        { width: 60, height: 20 } : 
        { width: 150, height: 100 },
      rotation: data.rotation || 0,
      description: data.description || null,
      status: 'active' as any // Cast to match enum
    };

    const { data: space, error: spaceError } = await supabase
      .from('new_spaces')
      .insert(spaceData)
      .select()
      .single();

    if (spaceError) {
      console.error('Error creating space:', spaceError);
      throw new Error(`Failed to create space: ${spaceError.message}`);
    }

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
          
        const isTransitionDoor = firstConnection.connectionType === 'door' && 
                                (fromSpaceData?.type === 'hallway' && targetSpaceData?.type === 'hallway');
        
        let directionValue = validateDirection(firstConnection.direction);
        
        const spaceConnectionData = {
          from_space_id: space.id,
          to_space_id: firstConnection.toSpaceId,
          space_type: data.type,
          connection_type: firstConnection.connectionType,
          direction: directionValue,
          connection_status: 'active',
          is_transition_door: isTransitionDoor,
          hallway_position: getHallwayPosition(firstConnection.direction),
          position: getPositionFromDirection(firstConnection.direction)
        };

        console.log('Creating connection with data:', spaceConnectionData);

        // Space connections feature removed - skip inserting connections
        const connectionError = null;

        if (connectionError) {
          console.error('Connection error:', connectionError);
          toast.error(`Space created but connection failed: ${connectionError.message}`);
        }
      }
    }

    console.log('Space created successfully:', space);
    return space;
  } catch (error) {
    console.error('Error in createSpace:', error);
    throw error;
  }
}
