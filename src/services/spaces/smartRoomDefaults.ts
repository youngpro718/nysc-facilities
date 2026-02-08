import { generateSmartRoomNumber, suggestRoomName } from '@/components/spaces/utils/roomNumberGenerator';
import { logger } from '@/lib/logger';
import { RoomTypeEnum } from '@/components/spaces/rooms/types/roomEnums';
import { supabase } from '@/lib/supabase';

export interface SmartDefaults {
  name: string;
  roomNumber: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomType: RoomTypeEnum;
}

interface GenerateDefaultsOptions {
  templateId: string;
  roomType: RoomTypeEnum;
  defaultName: string;
  buildingId?: string;
  floorId?: string;
}

/**
 * Generates smart defaults for room creation based on template and context
 */
export async function generateSmartDefaults(
  options: GenerateDefaultsOptions
): Promise<SmartDefaults> {
  const { templateId, roomType, defaultName, buildingId, floorId } = options;

  // Get building and floor info
  let finalBuildingId = buildingId;
  let finalFloorId = floorId;
  let buildingName = '';
  let floorName = '';
  let floorNumber = 1;

  // If no building selected, get the first available
  if (!finalBuildingId) {
    const { data: buildings } = await supabase
      .from('buildings')
      .select('id, name')
      .order('name')
      .limit(1);
    
    if (buildings && buildings.length > 0) {
      finalBuildingId = buildings[0].id;
      buildingName = buildings[0].name;
    }
  } else {
    const { data: building } = await supabase
      .from('buildings')
      .select('name')
      .eq('id', finalBuildingId)
      .single();
    
    if (building) {
      buildingName = building.name;
    }
  }

  // If no floor selected, get the first available for this building
  if (!finalFloorId && finalBuildingId) {
    const { data: floors } = await supabase
      .from('floors')
      .select('id, name, floor_number')
      .eq('building_id', finalBuildingId)
      .order('floor_number')
      .limit(1);
    
    if (floors && floors.length > 0) {
      finalFloorId = floors[0].id;
      floorName = floors[0].name;
      floorNumber = floors[0].floor_number;
    }
  } else if (finalFloorId) {
    const { data: floor } = await supabase
      .from('floors')
      .select('name, floor_number')
      .eq('id', finalFloorId)
      .single();
    
    if (floor) {
      floorName = floor.name;
      floorNumber = floor.floor_number;
    }
  }

  // Generate smart room number and name
  let suggestedName = defaultName;
  let suggestedRoomNumber = '';

  if (finalFloorId && finalBuildingId) {
    try {
      // Generate smart room number
      suggestedRoomNumber = await generateSmartRoomNumber({
        floorId: finalFloorId,
        floorNumber,
        roomType,
        buildingId: finalBuildingId
      });

      // Generate smart name
      suggestedName = await suggestRoomName(
        roomType,
        finalFloorId,
        finalBuildingId
      );
    } catch (error) {
      logger.error('Error generating smart defaults:', error);
      // Fallback to basic defaults
      suggestedRoomNumber = `${floorNumber}01`;
      suggestedName = defaultName;
    }
  }

  return {
    name: suggestedName,
    roomNumber: suggestedRoomNumber,
    buildingId: finalBuildingId || '',
    buildingName,
    floorId: finalFloorId || '',
    floorName,
    roomType
  };
}
