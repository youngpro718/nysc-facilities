
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { 
  CreateSpaceFormData, 
  RoomFormData, 
  HallwayFormData, 
  DoorFormData 
} from "../schemas/createSpaceSchema";

export async function createSpace(data: CreateSpaceFormData) {
  try {
    console.log("Creating space:", data);

    // 1. Create the base space record
    const { id: spaceId } = await createBaseSpaceRecord(data);
    
    // 2. Create type-specific properties
    if (data.type === "room") {
      await createRoomProperties(spaceId, data as RoomFormData);
    } else if (data.type === "hallway") {
      await createHallwayProperties(spaceId, data as HallwayFormData);
    } else if (data.type === "door") {
      await createDoorProperties(spaceId, data as DoorFormData);
    }

    // 3. Create connections if any
    if (data.connections && data.connections.length > 0) {
      await createSpaceConnections(spaceId, data);
    }

    return {
      success: true,
      spaceId,
      message: `${data.type} created successfully`,
    };
  } catch (error: any) {
    console.error("Error creating space:", error);
    throw new Error(error.message || "Failed to create space");
  }
}

async function createBaseSpaceRecord(data: CreateSpaceFormData) {
  // Create the base space entry
  const spaceData = {
    name: data.name,
    type: data.type,
    floor_id: data.floorId,
    status: data.status,
    position: data.position || { x: 0, y: 0 },
    size: {
      width: data.type === "door" ? 60 : (data.type === "hallway" ? 300 : 150),
      height: data.type === "door" ? 20 : (data.type === "hallway" ? 50 : 100)
    },
    rotation: data.rotation || 0,
    properties: {
      description: data.description
    }
  };

  if (data.type === "room") {
    spaceData.room_number = (data as RoomFormData).roomNumber;
  }

  const { data: spaceResult, error } = await supabase
    .from("new_spaces")
    .insert(spaceData)
    .select("id")
    .single();

  if (error) throw error;
  return spaceResult;
}

async function createRoomProperties(spaceId: string, data: RoomFormData) {
  // Create room-specific properties
  const roomProps = {
    space_id: spaceId,
    room_type: data.roomType,
    current_function: data.currentFunction,
    is_storage: data.isStorage,
    storage_type: data.isStorage ? data.storageType : null,
    storage_capacity: data.isStorage ? data.storageCapacity : null,
    parent_room_id: data.parentRoomId,
    phone_number: data.phoneNumber,
  };

  const { error } = await supabase
    .from("room_properties")
    .insert(roomProps);

  if (error) throw error;
}

async function createHallwayProperties(spaceId: string, data: HallwayFormData) {
  // Create hallway-specific properties
  const hallwayProps = {
    space_id: spaceId,
    section: data.section,
    hallway_type: data.hallwayType,
    traffic_flow: data.trafficFlow,
    accessibility: data.accessibility,
    emergency_route: data.emergencyRoute,
    maintenance_priority: data.maintenancePriority,
    capacity_limit: data.capacityLimit
  };

  const { error } = await supabase
    .from("hallway_properties")
    .insert(hallwayProps);

  if (error) throw error;
}

async function createDoorProperties(spaceId: string, data: DoorFormData) {
  // Create door-specific properties
  const doorProps = {
    space_id: spaceId,
    door_type: data.doorType,
    security_level: data.securityLevel,
    is_transition_door: data.isTransitionDoor,
    has_closing_issue: data.hasClosingIssue,
    has_handle_issue: data.hasHandleIssue,
  };

  const { error } = await supabase
    .from("door_properties")
    .insert(doorProps);

  if (error) throw error;
}

async function createSpaceConnections(spaceId: string, data: CreateSpaceFormData) {
  if (!data.connections || !data.connections.length) return;
  
  // Create connections for the space
  const connections = data.connections.map((conn) => {
    if (!conn.toSpaceId || !conn.connectionType) return null;
    
    return {
      from_space_id: spaceId,
      to_space_id: conn.toSpaceId,
      space_type: data.type,
      connection_type: conn.connectionType,
      direction: conn.direction || "",
      status: "active",
      connection_status: "active", 
      is_transition_door: conn.connectionType === "transition",
      hallway_position: data.type === "hallway" ? 0 : undefined, // Default position
      position: conn.direction || "center"
    };
  }).filter(Boolean);

  if (connections.length === 0) return;

  // Batch insert connections
  for (const connection of connections) {
    const { error } = await supabase
      .from("space_connections")
      .insert(connection);

    if (error) {
      console.error("Error creating connection:", error);
      // Continue with next connection instead of failing the whole operation
    }
  }
}
