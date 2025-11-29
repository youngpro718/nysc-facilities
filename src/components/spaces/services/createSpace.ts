import { supabase } from "@/lib/supabase";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { 
  RoomTypeEnum, 
  StorageTypeEnum, 
  roomTypeToString, 
  storageTypeToString 
} from "../rooms/types/roomEnums";
import { toast } from "sonner";

// Type guard function to check if the data has a valid space type
function hasValidSpaceType(data: unknown): data is CreateSpaceFormData {
  return data !== null && typeof data === 'object' && 
         'type' in data && ['room', 'hallway', 'door'].includes((data as CreateSpaceFormData).type);
}

export async function createSpace(data: CreateSpaceFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  if (!hasValidSpaceType(data)) {
    throw new Error(`Invalid or missing space type: ${String((data as Record<string, unknown>)?.type || 'unknown')}`);
  }
  
  try {
    // Now TypeScript knows data.type is one of the valid types
    // Handle room creation
    if (data.type === 'room') {
      // Map the enum to the correct database value
      let dbRoomType = data.roomType ? roomTypeToString(data.roomType as RoomTypeEnum) : 'office';
      
      // Ensure the room type matches database enum values - updated to match actual DB
      const validRoomTypes = [
        'office', 'courtroom', 'chamber', 'judges_chambers', 'jury_room',
        'conference_room', 'filing_room', 'male_locker_room', 'female_locker_room',
        'robing_room', 'stake_holder', 'records_room', 'administrative_office',
        'break_room', 'it_room', 'utility_room', 'laboratory', 'conference'
      ];
      
      if (!validRoomTypes.includes(dbRoomType)) {
        dbRoomType = 'office'; // Default fallback
      }
      
      const roomData = {
        name: data.name,
        room_number: data.roomNumber || null,
        room_type: dbRoomType,
        floor_id: data.floorId,
        description: data.description || null,
        phone_number: data.phoneNumber || null,
        // If marked as storage, do not persist a current_function
        current_function: data.isStorage ? null : (data.currentFunction || null),
        is_storage: !!data.isStorage,
        storage_type: data.isStorage && data.storageType ? 
          storageTypeToString(data.storageType as StorageTypeEnum) : null,
        storage_capacity: data.isStorage && data.storageCapacity ? data.storageCapacity : null,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 150, height: 100 },
        rotation: data.rotation || 0,
        courtroom_photos: data.roomType === RoomTypeEnum.COURTROOM ? 
          (data.courtRoomPhotos || { judge_view: null, audience_view: null }) : null
      };
      
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        if ((roomError as any).code === '23505') {
          toast.error('Room number already exists. Please use a unique room number.');
        } else if ((roomError as any).code === '42501') {
          toast.error('Permission denied. Please check your authentication status.');
        } else {
          toast.error(`Failed to create room: ${roomError.message}`);
        }
        throw new Error(`Failed to create room: ${roomError.message}`);
      }

      return room;
    }

    if (data.type === 'hallway') {
      // Map/normalize to DB enums
      const TYPE_ALLOWED = new Set(['public_main','private','private_main']);
      const SECTION_ALLOWED = new Set(['left_wing','right_wing','connector']);
      const STATUS_ALLOWED = new Set(['active','inactive','under_maintenance']);
      const type = TYPE_ALLOWED.has((data as any).hallwayType as string) ? (data as any).hallwayType : 'public_main';
      const section = SECTION_ALLOWED.has((data as any).section as string) ? (data as any).section : 'connector';
      const status = STATUS_ALLOWED.has((data as any).status as string) ? (data as any).status : 'active';

      // Prepare hallway data according to the hallways table schema
      const hallwayData = {
        name: data.name ?? 'Hallway',
        floor_id: data.floorId,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 300, height: 50 },
        rotation: data.rotation || 0,
        description: data.description || null,
        status,
        width_meters: (data as any).width ?? (data as any).size?.width ?? 2,
        accessibility: (data as any).accessibility || 'fully_accessible',
        type,        // hallway_type_enum
        section      // hallway_section_enum
      } as any;

      // Insert into the hallways table
      const { data: hallway, error: hallwayError } = await supabase
        .from('hallways')
        .insert(hallwayData as any) // Type assertion to satisfy TypeScript
        .select()
        .single();

      if (hallwayError) {
        if ((hallwayError as any).code === '42501') {
          toast.error('Permission denied. Please check your authentication status.');
        } else {
          toast.error(`Failed to create hallway: ${hallwayError.message}`);
        }
        throw new Error(`Failed to create hallway: ${hallwayError.message}`);
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
        if ((doorError as any).code === '42501') {
          toast.error('Permission denied. Please check your authentication status.');
        } else {
          toast.error(`Failed to create door: ${doorError.message}`);
        }
        throw new Error(`Failed to create door: ${doorError.message}`);
      }

      return door;
    }

    
  } catch (error) {
    throw error;
  }
}
