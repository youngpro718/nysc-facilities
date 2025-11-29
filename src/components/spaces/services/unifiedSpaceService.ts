import { supabase } from "@/lib/supabase";
import { UnifiedSpaceFormData } from "../schemas/unifiedSpaceSchema";
import { formToDbRoom } from "../forms/room/roomFieldMapping";

export interface SpaceServiceResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class UnifiedSpaceService {
  async createSpace(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    try {
      if (!data.buildingId) {
        throw new Error("Building is required for creating spaces");
      }

      switch (data.type) {
        case "room":
          return await this.createRoom(data);
        case "hallway":
          return await this.createHallway(data);
        case "door":
          return await this.createDoor(data);
        default:
          throw new Error(`Unsupported space type: ${(data as Record<string, unknown>).type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  async updateSpace(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    try {
      switch (data.type) {
        case "room":
          return await this.updateRoom(id, data);
        case "hallway":
          return await this.updateHallway(id, data);
        case "door":
          return await this.updateDoor(id, data);
        default:
          throw new Error(`Unsupported space type: ${(data as Record<string, unknown>).type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private async createRoom(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "room") {
      throw new Error("Invalid data type for room creation");
    }

    const dbData = formToDbRoom(data as Parameters<typeof formToDbRoom>[0]);

    const { data: result, error } = await supabase
      .from('rooms')
      .insert(dbData as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  }

  private async updateRoom(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "room") {
      throw new Error("Invalid data type for room update");
    }

    const dbData = formToDbRoom(data as Parameters<typeof formToDbRoom>[0]);

    const { data: result, error } = await supabase
      .from('rooms')
      .update(dbData as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  }

  private async createHallway(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "hallway") {
      throw new Error("Invalid data type for hallway creation");
    }
    // Sanitize enums to match DB enum values
    const TYPE_ALLOWED = new Set(["public_main", "private", "private_main"]);
    const SECTION_ALLOWED = new Set(["left_wing", "right_wing", "connector"]);
    const STATUS_ALLOWED = new Set(["active", "inactive", "under_maintenance"]);
    const type = TYPE_ALLOWED.has((data as any).hallwayType) ? (data as any).hallwayType : "public_main";
    const section = SECTION_ALLOWED.has((data as any).section) ? (data as any).section : "connector";
    const status = STATUS_ALLOWED.has((data as any).status) ? (data as any).status : "active";

    const hallwayData = {
      name: data.name ?? 'Hallway',
      floor_id: data.floorId,
      description: data.description ?? null,
      type,
      section,
      traffic_flow: (data as any).trafficFlow ?? null,
      accessibility: (data as any).accessibility ?? null,
      emergency_route: (data as any).emergencyRoute ?? null,
      maintenance_priority: (data as any).maintenancePriority ?? null,
      capacity_limit: (data as any).capacityLimit ?? null,
      width_meters: (data as any).width ?? (data as any).size?.width ?? 50,
      length_meters: (data as any).length ?? (data as any).size?.length ?? null,
      status,
      position: data.position ?? { x: 0, y: 0 },
      size: data.size ?? { width: 300, height: 50 },
      rotation: data.rotation ?? 0
    } as any;

    const { data: result, error } = await supabase
      .from('hallways')
      .insert(hallwayData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  }

  private async updateHallway(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "hallway") {
      throw new Error("Invalid data type for hallway update");
    }
    const TYPE_ALLOWED = new Set(["public_main", "private", "private_main"]);
    const SECTION_ALLOWED = new Set(["left_wing", "right_wing", "connector"]);
    const STATUS_ALLOWED = new Set(["active", "inactive", "under_maintenance"]);
    const type = TYPE_ALLOWED.has((data as any).hallwayType) ? (data as any).hallwayType : "public_main";
    const section = SECTION_ALLOWED.has((data as any).section) ? (data as any).section : "connector";
    const status = STATUS_ALLOWED.has((data as any).status) ? (data as any).status : "active";

    const hallwayData = {
      name: data.name ?? 'Hallway',
      description: data.description ?? null,
      type,
      section,
      traffic_flow: (data as any).trafficFlow ?? null,
      accessibility: (data as any).accessibility ?? null,
      emergency_route: (data as any).emergencyRoute ?? null,
      maintenance_priority: (data as any).maintenancePriority ?? null,
      capacity_limit: (data as any).capacityLimit ?? null,
      width_meters: (data as any).width ?? (data as any).size?.width ?? 50,
      length_meters: (data as any).length ?? (data as any).size?.length ?? null,
      status,
      position: data.position ?? { x: 0, y: 0 },
      size: data.size ?? { width: 300, height: 50 },
      rotation: data.rotation ?? 0
    } as any;

    const { data: result, error } = await supabase
      .from('hallways')
      .update(hallwayData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  }

  private async createDoor(data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "door") {
      throw new Error("Invalid data type for door creation");
    }

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

    const { data: result, error } = await supabase
      .from('doors')
      .insert(doorData as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  }

  private async updateDoor(id: string, data: UnifiedSpaceFormData): Promise<SpaceServiceResult> {
    if (data.type !== "door") {
      throw new Error("Invalid data type for door update");
    }

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

    const { data: result, error } = await supabase
      .from('doors')
      .update(doorData as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  }
}

export const unifiedSpaceService = new UnifiedSpaceService();