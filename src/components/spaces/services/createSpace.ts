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
function hasValidSpaceType(data: any): data is CreateSpaceFormData {
  return data && typeof data === 'object' && 
         data.type && ['room', 'hallway', 'door'].includes(data.type);
}

export async function createSpace(data: CreateSpaceFormData) {
  console.log('=== CREATE SPACE STARTED ===');
  console.log('Creating space with data:', data);
  
  // Check authentication first
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);
  
  if (!user) {
    const errorMsg = 'User not authenticated';
    console.error('Authentication failed:', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Validate the data has a valid type
  if (!hasValidSpaceType(data)) {
    const errorMsg = `Invalid or missing space type: ${String((data as any)?.type || 'unknown')}`;
    console.error('Validation failed:', errorMsg);
    throw new Error(errorMsg);
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
      
      console.log('Final room data being inserted:', roomData);

      console.log('Inserting room data:', roomData);

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        console.error('=== ROOM CREATION ERROR ===');
        console.error('Error details:', roomError);
        console.error('Error code:', (roomError as any).code);
        console.error('Error hint:', (roomError as any).hint);
        console.error('Room data that failed:', roomData);
        
        if ((roomError as any).code === '23505') {
          toast.error('Room number already exists. Please use a unique room number.');
        } else if ((roomError as any).code === '42501') {
          toast.error('Permission denied. Please check your authentication status.');
        } else {
          toast.error(`Failed to create room: ${roomError.message}`);
        }
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
        console.error('=== HALLWAY CREATION ERROR ===');
        console.error('Error details:', hallwayError);
        console.error('Error code:', (hallwayError as any).code);
        console.error('Hallway data that failed:', hallwayData);
        
        if ((hallwayError as any).code === '42501') {
          toast.error('Permission denied. Please check your authentication status.');
        } else {
          toast.error(`Failed to create hallway: ${hallwayError.message}`);
        }
        throw new Error(`Failed to create hallway: ${hallwayError.message}`);
      }

      console.log('Created hallway:', hallway);
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
        console.error('=== DOOR CREATION ERROR ===');
        console.error('Error details:', doorError);
        console.error('Error code:', (doorError as any).code);
        console.error('Door data that failed:', doorData);
        
        if ((doorError as any).code === '42501') {
          toast.error('Permission denied. Please check your authentication status.');
        } else {
          toast.error(`Failed to create door: ${doorError.message}`);
        }
        throw new Error(`Failed to create door: ${doorError.message}`);
      }

      console.log('Created door:', door);
      return door;
    }

    
  } catch (error) {
    console.error('Error in createSpace:', error);
    throw error;
  }
}
