
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";

export const createSpace = async (formData: CreateSpaceFormData) => {
  console.log("Creating space with data:", formData);
  
  try {
    // Set default values for position, size, and rotation
    const position = formData.position || { x: 0, y: 0 };
    const size = formData.size || (
      formData.type === 'hallway' 
        ? { width: 300, height: 50 } 
        : formData.type === 'door'
          ? { width: 60, height: 20 }
          : { width: 150, height: 100 }
    );
    const rotation = formData.rotation || 0;
    
    // Create base space object
    const spaceData = {
      name: formData.name,
      floor_id: formData.floorId,
      type: formData.type,
      status: formData.status,
      position,
      size,
      rotation,
      properties: formData.description 
        ? { description: formData.description } 
        : {}
    };

    // Check if we need to add a room number for rooms
    if (formData.type === "room" && formData.roomNumber) {
      (spaceData as any).room_number = formData.roomNumber;
    }

    console.log("Inserting space:", spaceData);
    
    // Insert the space
    const { data: newSpace, error: spaceError } = await supabase
      .from("new_spaces")
      .insert(spaceData)
      .select("id")
      .single();

    if (spaceError) throw spaceError;
    
    const spaceId = newSpace.id;
    console.log("Created space with ID:", spaceId);

    // Handle type-specific logic
    if (formData.type === "room") {
      await createRoomProperties(formData, spaceId);
    } else if (formData.type === "hallway") {
      await createHallwayProperties(formData, spaceId);
    } else if (formData.type === "door") {
      await createDoorProperties(formData, spaceId);
    }

    // Handle connections if any
    if (formData.connections && formData.connections.length > 0) {
      await createConnections(formData.connections, spaceId, formData.type);
    }

    return { id: spaceId, type: formData.type };
  } catch (error) {
    console.error("Error creating space:", error);
    throw error;
  }
};

async function createRoomProperties(formData: CreateSpaceFormData & { type: "room" }, spaceId: string) {
  const roomProps = {
    space_id: spaceId,
    room_type: formData.roomType,
    is_storage: formData.isStorage || false,
    current_function: formData.currentFunction || null,
    parent_room_id: formData.parentRoomId || null,
    phone_number: formData.phoneNumber || null,
    storage_type: formData.isStorage ? formData.storageType : null,
    storage_capacity: formData.isStorage ? formData.storageCapacity : null,
    storage_notes: formData.isStorage ? formData.storageNotes : null
  };

  console.log("Inserting room properties:", roomProps);
  
  const { error } = await supabase
    .from("room_properties")
    .insert(roomProps);

  if (error) throw error;
}

async function createHallwayProperties(formData: CreateSpaceFormData & { type: "hallway" }, spaceId: string) {
  const hallwayProps = {
    space_id: spaceId,
    section: formData.section || "connector",
    hallway_type: formData.hallwayType || "public_main",
    traffic_flow: formData.trafficFlow || "two_way",
    accessibility: formData.accessibility || "fully_accessible", 
    emergency_route: formData.emergencyRoute || "not_designated",
    maintenance_priority: formData.maintenancePriority || "low",
    capacity_limit: formData.capacityLimit || null
  };

  console.log("Inserting hallway properties:", hallwayProps);
  
  const { error } = await supabase
    .from("hallway_properties")
    .insert(hallwayProps);

  if (error) throw error;
}

async function createDoorProperties(formData: CreateSpaceFormData & { type: "door" }, spaceId: string) {
  const doorProps = {
    space_id: spaceId,
    security_level: formData.securityLevel || "standard",
    is_transition_door: formData.isTransitionDoor || false,
    has_closing_issue: formData.hasClosingIssue || false,
    has_handle_issue: formData.hasHandleIssue || false,
  };

  console.log("Inserting door properties:", doorProps);
  
  const { error } = await supabase
    .from("door_properties")
    .insert(doorProps);

  if (error) throw error;
}

async function createConnections(
  connections: Array<{ toSpaceId?: string; connectionType?: string; direction?: string }>,
  fromSpaceId: string,
  spaceType: string
) {
  const validConnections = connections.filter(
    (conn) => conn.toSpaceId && conn.connectionType
  );
  
  if (validConnections.length === 0) return;

  // Prepare connections
  const connectionsToInsert = validConnections.map((conn) => ({
    from_space_id: fromSpaceId,
    to_space_id: conn.toSpaceId as string,
    space_type: spaceType,
    connection_type: conn.connectionType as string,
    direction: conn.direction || "adjacent",
    status: "active",
    connection_status: "active",
    is_transition_door: false,
    hallway_position: 0,
    position: conn.direction || "adjacent"
  }));

  console.log("Inserting connections:", connectionsToInsert);
  
  const { error } = await supabase
    .from("space_connections")
    .insert(connectionsToInsert);

  if (error) throw error;
}
