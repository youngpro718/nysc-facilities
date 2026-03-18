import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface RoomNumberOptions {
  floorId: string;
  floorNumber: number;
  roomType: string;
  buildingId: string;
}

/**
 * Generates a smart room number based on floor, existing rooms, and room type
 */
export async function generateSmartRoomNumber({ 
  floorId, 
  floorNumber, 
  roomType, 
  buildingId 
}: RoomNumberOptions): Promise<string> {
  try {
    // Get existing room numbers on this floor
    const { data: existingRooms, error } = await supabase
      .from('rooms')
      .select('room_number')
      .eq('floor_id', floorId)
      .not('room_number', 'is', null);

    if (error) {
      logger.error('Error fetching existing rooms:', error);
      return generateFallbackRoomNumber(floorNumber);
    }

    const existingNumbers = new Set(
      existingRooms
        ?.map(room => room.room_number)
        .filter(Boolean) || []
    );

    // Generate room number based on type and floor
    const prefix = floorNumber.toString();
    
    // Different starting ranges for different room types
    const typeRanges = {
      'courtroom': { start: 1, end: 20 },
      'office': { start: 21, end: 80 },
      'conference_room': { start: 81, end: 90 },
      'storage': { start: 91, end: 95 },
      'bathroom': { start: 96, end: 98 },
      'break_room': { start: 99, end: 99 },
      'default': { start: 1, end: 99 }
    };

    const range = typeRanges[roomType as keyof typeof typeRanges] || typeRanges.default;

    // Find first available number in the range
    for (let i = range.start; i <= range.end; i++) {
      const roomNumber = `${prefix}${i.toString().padStart(2, '0')}`;
      if (!existingNumbers.has(roomNumber)) {
        return roomNumber;
      }
    }

    // If no numbers available in preferred range, find any available
    for (let i = 1; i <= 99; i++) {
      const roomNumber = `${prefix}${i.toString().padStart(2, '0')}`;
      if (!existingNumbers.has(roomNumber)) {
        return roomNumber;
      }
    }

    // Fallback to random if all numbers taken
    return generateFallbackRoomNumber(floorNumber);

  } catch (error) {
    logger.error('Error generating room number:', error);
    return generateFallbackRoomNumber(floorNumber);
  }
}

function generateFallbackRoomNumber(floorNumber: number): string {
  const randomNum = Math.floor(Math.random() * 99) + 1;
  return `${floorNumber}${randomNum.toString().padStart(2, '0')}`;
}

/**
 * Suggests a room name based on type and existing rooms
 */
export async function suggestRoomName(
  roomType: string, 
  floorId: string, 
  buildingId: string
): Promise<string> {
  try {
    // Get count of similar rooms on this floor
    const { data: similarRooms, error } = await supabase
      .from('rooms')
      .select('name, room_type')
      .eq('floor_id', floorId)
      .eq('room_type', roomType);

    if (error) {
      return getDefaultRoomName(roomType);
    }

    const count = similarRooms?.length || 0;
    const baseName = getDefaultRoomName(roomType);

    if (count === 0) {
      return baseName;
    }

    // Add number suffix for multiple rooms of same type
    return `${baseName} ${count + 1}`;

  } catch (error) {
    return getDefaultRoomName(roomType);
  }
}

function getDefaultRoomName(roomType: string): string {
  const nameMap: Record<string, string> = {
    'courtroom': 'Courtroom',
    'office': 'Office',
    'conference_room': 'Conference Room',
    'storage': 'Storage Room',
    'bathroom': 'Restroom',
    'break_room': 'Break Room',
    'security_office': 'Security Office',
    'records_room': 'Records Room'
  };

  return nameMap[roomType] || 'Room';
}
