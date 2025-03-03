
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";
import { toast } from "sonner";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
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
    const hallwayData = {
      name: data.name,
      type: data.type,
      floor_id: data.floorId,
      status: data.status,
      // Use hallway-specific dimensions (longer and thinner)
      position: data.position || { x: 0, y: 0 },
      size: data.size || { width: 300, height: 50 },
      rotation: data.rotation || 0,
      // Store hallway-specific properties
      properties: {
        section: data.section || 'connector',
        hallwayType: data.hallwayType || 'public_main',
        maintenance_priority: data.maintenancePriority || 'low',
        accessibility: data.accessibility || 'fully_accessible',
        traffic_flow: data.trafficFlow || 'two_way',
        emergency_route: data.emergencyRoute || 'not_designated',
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

    // Create hallway properties in the specialized table
    const hallwayPropsData = {
      space_id: hallway.id,
      section: data.section || 'connector',
      traffic_flow: data.trafficFlow || 'two_way',
      accessibility: data.accessibility || 'fully_accessible',
      emergency_route: data.emergencyRoute || 'not_designated',
      maintenance_priority: data.maintenancePriority || 'low',
      capacity_limit: data.capacityLimit
    };

    const { error: propsError } = await supabase
      .from('hallway_properties')
      .insert([hallwayPropsData]);

    if (propsError) {
      console.error('Error saving hallway properties:', propsError);
      // Don't throw here, proceed with connections if possible
    }

    // Only create a connection if all required data is present
    if (data.connections && data.connections.toSpaceId && data.connections.connectionType && data.connections.direction) {
      const connectionData = {
        from_space_id: hallway.id,
        to_space_id: data.connections.toSpaceId,
        space_type: data.type,
        connection_type: data.connections.connectionType,
        direction: data.connections.direction,
        status: data.status as 'active' | 'inactive' | 'under_maintenance',
        connection_status: 'active',
        // Add hallway-specific connection data
        hallway_position: 0.5, // Default to middle (0-1 range)
        offset_distance: 50,   // Default offset from hallway
        position: data.connections.direction === 'north' || data.connections.direction === 'south' ? 'vertical' : 'horizontal'
      };

      console.log('Creating connection with data:', connectionData);

      const { error: connectionError } = await supabase
        .from('space_connections')
        .insert([connectionData]);

      if (connectionError) {
        console.error('Connection error:', connectionError);
        toast.error(`Space created but connection failed: ${connectionError.message}`);
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
      data.size || { width: 150, height: 100 },
    rotation: data.rotation || 0
  };

  const { data: space, error: spaceError } = await supabase
    .from('new_spaces')
    .insert([spaceData])
    .select()
    .single();

  if (spaceError) throw spaceError;

  // Only create a connection if all required data is present
  if (data.connections && data.connections.toSpaceId && data.connections.connectionType && data.connections.direction) {
    const connectionData = {
      from_space_id: space.id,
      to_space_id: data.connections.toSpaceId,
      space_type: data.type,
      connection_type: data.connections.connectionType,
      direction: data.connections.direction,
      status: data.status as 'active' | 'inactive' | 'under_maintenance',
      connection_status: 'active'
    };

    console.log('Creating connection with data:', connectionData);

    const { error: connectionError } = await supabase
      .from('space_connections')
      .insert([connectionData]);

    if (connectionError) {
      console.error('Connection error:', connectionError);
      toast.error(`Space created but connection failed: ${connectionError.message}`);
    }
  }

  return space;
}
