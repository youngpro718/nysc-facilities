import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { 
  RoomTypeEnum, 
  StorageTypeEnum, 
  roomTypeToString, 
  storageTypeToString 
} from "../rooms/types/roomEnums";
import { toast } from "sonner";

// Type guard function to check if the data has a valid space type
function hasValidSpaceType(data: any): data is CreateSpaceFormData {
  return data && typeof data === 'object' && 
         data.type && ['room', 'hallway', 'door'].includes(data.type);
}

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  // Validate the data has a valid type
  if (!hasValidSpaceType(data)) {
    throw new Error(`Invalid or missing space type: ${String((data as any)?.type || 'unknown')}`);
  }
  
  try {
    // Now TypeScript knows data.type is one of the valid types
    // Handle room creation
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
      
      // Handle connections if present
      if (data.connections && data.connections.length > 0 && room) {
        await handleSpaceConnections(room, data);
      }
      
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
      
      // Prepare hallway data according to the hallways table schema
      const hallwayData = {
        name: data.name,
        floor_id: data.floorId,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 300, height: 50 },
        rotation: data.rotation || 0,
        description: data.description || null,
        status: 'active' as any, // Cast to match enum
        width_meters: data.width || 2, // Use width from schema as width_meters
        accessibility: data.accessibility || 'fully_accessible',
        type: 'hallway' // Required field for the hallways table
      };

      // Insert into the hallways table
      const { data: hallway, error: hallwayError } = await supabase
        .from('hallways')
        .insert(hallwayData as any) // Type assertion to satisfy TypeScript
        .select()
        .single();

      if (hallwayError) {
        console.error('Error creating hallway:', hallwayError);
        throw new Error(`Failed to create hallway: ${hallwayError.message}`);
      }

      console.log('Created hallway:', hallway);

      // Create hallway properties
      if (hallway && hallway.id) {
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
      }

      // Handle connections if present
      if (data.connections && data.connections.length > 0 && hallway) {
        await handleSpaceConnections(hallway, data);
      }

      return hallway;
    }

    if (data.type === 'door') {
      // Door-specific schema
      const doorData = {
        name: data.name,
        floor_id: data.floorId,
        position: data.position || { x: 0, y: 0 },
        size: { width: 60, height: 20 },
        rotation: data.rotation || 0,
        description: data.description || null,
        status: 'active' as any,
        door_type: data.doorType || 'standard',
        access_type: (data as any).accessType || 'unrestricted',
        lock_type: (data as any).lockType || 'none',
        type: 'door' // Required field for the doors table
      };

      // Insert into the doors table
      const { data: door, error: doorError } = await supabase
        .from('doors')
        .insert(doorData as any) // Type assertion to satisfy TypeScript
        .select()
        .single();

      if (doorError) {
        console.error('Error creating door:', doorError);
        throw new Error(`Failed to create door: ${doorError.message}`);
      }

      console.log('Created door:', door);

      // Handle connections if present
      if (data.connections && data.connections.length > 0 && door) {
        await handleSpaceConnections(door, data);
      }

      return door;
    }

    // This code should never execute because we've handled all valid space types
    // and validated at the beginning of the function
    // Use a type assertion that TypeScript will accept
    const unknownData = data as unknown as { type: string };
    throw new Error(`Unsupported space type: ${unknownData.type}`);
    
  } catch (error) {
    console.error('Error in createSpace:', error);
    throw error;
  }
}

// Helper function to handle space connections
async function handleSpaceConnections(space: any, data: CreateSpaceFormData) {
  if (!space || !space.id) {
    console.error('Cannot create connections: space is missing or has no ID');
    return;
  }

  if (!data.connections || data.connections.length === 0) {
    return;
  }

  const firstConnection = data.connections[0];
  if (!firstConnection || !firstConnection.toSpaceId || !firstConnection.connectionType) {
    console.error('Connection data is incomplete');
    return;
  }

  // Check if the target space exists and determine its type
  let targetSpaceType = null;
  
  // First check rooms
  const { data: roomData } = await supabase
    .from('rooms')
    .select('id')
    .eq('id', firstConnection.toSpaceId)
    .single();
    
  if (roomData) {
    targetSpaceType = 'room';
  } else {
    // Check hallways
    const { data: hallwayData } = await supabase
      .from('hallways')
      .select('id')
      .eq('id', firstConnection.toSpaceId)
      .single();
      
    if (hallwayData) {
      targetSpaceType = 'hallway';
    } else {
      // Check doors
      const { data: doorData } = await supabase
        .from('doors')
        .select('id')
        .eq('id', firstConnection.toSpaceId)
        .single();
        
      if (doorData) {
        targetSpaceType = 'door';
      }
    }
  }

  if (!targetSpaceType) {
    console.error('Target space not found in any table');
    return;
  }
    
  // Check if this is a transition door (door between hallways)
  const isTransitionDoor = firstConnection.connectionType === 'door' && 
                          (data.type === 'hallway' && targetSpaceType === 'hallway');
  
  // Helper function to validate direction
  const validateDirection = (direction: string | undefined): string => {
    const validDirections = ['north', 'south', 'east', 'west'];
    return direction && validDirections.includes(direction) ? direction : 'north';
  };
  
  const directionValue = validateDirection(firstConnection.direction);
  
  // Helper function to get position from direction
  const getPositionFromDirection = (
    direction: string, 
    position: { x: number, y: number } = { x: 0, y: 0 }, 
    size: { width: number, height: number } = { width: 0, height: 0 }
  ) => {
    const offset = 50;
    switch(direction) {
      case 'north':
        return { x: position.x, y: position.y - offset - size.height };
      case 'south':
        return { x: position.x, y: position.y + offset + size.height };
      case 'east':
        return { x: position.x + offset + size.width, y: position.y };
      case 'west':
        return { x: position.x - offset - size.width, y: position.y };
      default:
        return { x: position.x, y: position.y - offset - size.height };
    }
  };
  
  // Helper function to get hallway position
  const getHallwayPosition = (
    direction: string, 
    position: { x: number, y: number } = { x: 0, y: 0 }
  ) => {
    return position;
  };
  
  // Get position and size from space
  const position = space.position || { x: 0, y: 0 };
  const size = space.size || { width: 0, height: 0 };
  
  const spaceConnectionData = {
    from_space_id: space.id,
    to_space_id: firstConnection.toSpaceId,
    space_type: data.type,
    connection_type: firstConnection.connectionType,
    direction: directionValue,
    connection_status: 'active',
    is_transition_door: isTransitionDoor,
    hallway_position: getHallwayPosition(firstConnection.direction, position),
    position: getPositionFromDirection(firstConnection.direction, position, size)
  };

  console.log('Creating connection with data:', spaceConnectionData);

  // Insert the connection data
  const { error: connectionError } = await supabase
    .from('space_connections')
    .insert(spaceConnectionData as any);

  if (connectionError) {
    console.error('Connection error:', connectionError);
    toast.error(`Space created but connection failed: ${connectionError.message}`);
  } else {
    console.log('Created space connection successfully');
  }
}
