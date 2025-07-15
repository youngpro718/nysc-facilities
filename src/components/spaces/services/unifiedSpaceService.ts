import { supabase } from "@/integrations/supabase/client";
import { UnifiedSpaceFormData } from "../schemas/unifiedSpaceSchema";
import { formToDbRoom } from "../forms/room/roomFieldMapping";

export interface SpaceServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class UnifiedSpaceService {
  async createSpace(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    try {
      console.log('=== UnifiedSpaceService.createSpace ===');
      console.log('Input data:', data);

      if (!data.buildingId) {
        throw new Error("Building is required for creating spaces");
      }

      // Route to appropriate table based on space type
      if (data.type === "room") {
        return await this.createRoom(data);
      } else if (data.type === "hallway") {
        return await this.createHallway(data);
      } else if (data.type === "door") {
        return await this.createDoor(data);
      } else {
        throw new Error(`Unsupported space type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error in createSpace:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  async updateSpace(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    try {
      console.log('=== UnifiedSpaceService.updateSpace ===');
      console.log('ID:', id);
      console.log('Input data:', data);

      // Route to appropriate table based on space type
      if (data.type === "room") {
        return await this.updateRoom(id, data);
      } else if (data.type === "hallway") {
        return await this.updateHallway(id, data);
      } else if (data.type === "door") {
        return await this.updateDoor(id, data);
      } else {
        throw new Error(`Unsupported space type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error in updateSpace:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private async createRoom(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    // Convert form data to database format
    const dbData = formToDbRoom(data as any);
    
    console.log('Creating room with data:', dbData);

    const { data: result, error } = await supabase
      .from('rooms')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating room:', error);
      throw error;
    }

    return { success: true, data: result };
  }

  private async updateRoom(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    // Convert form data to database format
    const dbData = formToDbRoom(data as any);
    
    console.log('Updating room with ID:', id);
    console.log('Update data:', dbData);

    const { data: result, error } = await supabase
      .from('rooms')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating room:', error);
      throw error;
    }

    return { success: true, data: result };
  }

  private async createHallway(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "hallway") throw new Error("Invalid data type for hallway creation");
    
    const hallwayData = {
      name: data.name,
      floor_id: data.floorId,
      description: data.description,
      type: data.hallwayType,
      section: data.section,
      traffic_flow: data.trafficFlow,
      accessibility: data.accessibility,
      emergency_route: data.emergencyRoute,
      maintenance_priority: data.maintenancePriority,
      capacity_limit: data.capacityLimit,
      width_meters: data.width,
      length_meters: data.length,
      status: data.status,
      position: data.position,
      size: data.size,
      rotation: data.rotation
    };

    console.log('Creating hallway with data:', hallwayData);

    const { data: result, error } = await supabase
      .from('hallways')
      .insert(hallwayData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating hallway:', error);
      throw error;
    }

    return { success: true, data: result };
  }

  private async updateHallway(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    const hallwayData = {
      name: data.name,
      description: data.description,
      type: data.hallwayType,
      section: data.section,
      traffic_flow: data.trafficFlow,
      accessibility: data.accessibility,
      emergency_route: data.emergencyRoute,
      maintenance_priority: data.maintenancePriority,
      capacity_limit: data.capacityLimit,
      width_meters: data.width,
      length_meters: data.length,
      status: data.status,
      position: data.position,
      size: data.size,
      rotation: data.rotation
    };

    console.log('Updating hallway with ID:', id);
    console.log('Update data:', hallwayData);

    const { data: result, error } = await supabase
      .from('hallways')
      .update(hallwayData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating hallway:', error);
      throw error;
    }

    return { success: true, data: result };
  }

  private async createDoor(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    const doorData = {
      name: data.name,
      floor_id: data.floorId,
      type: data.doorType,
      security_level: data.securityLevel,
      passkey_enabled: data.passkeyEnabled,
      closer_status: data.closerStatus,
      status: data.status,
      position: data.position,
      size: data.size,
      rotation: data.rotation
    };

    console.log('Creating door with data:', doorData);

    const { data: result, error } = await supabase
      .from('doors')
      .insert(doorData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating door:', error);
      throw error;
    }

    return { success: true, data: result };
  }

  private async updateDoor(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    const doorData = {
      name: data.name,
      type: data.doorType,
      security_level: data.securityLevel,
      passkey_enabled: data.passkeyEnabled,
      closer_status: data.closerStatus,
      status: data.status,
      position: data.position,
      size: data.size,
      rotation: data.rotation
    };

    console.log('Updating door with ID:', id);
    console.log('Update data:', doorData);

    const { data: result, error } = await supabase
      .from('doors')
      .update(doorData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating door:', error);
      throw error;
    }

    return { success: true, data: result };
  }
}

export const unifiedSpaceService = new UnifiedSpaceService();