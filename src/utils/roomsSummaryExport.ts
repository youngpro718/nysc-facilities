/**
 * Quick Rooms Summary Export Utility
 * Generates a shareable Excel file with building and room summary data
 */

import { supabase } from '@/lib/supabase';
import { exportMultipleSheets } from './excelExport';

interface RoomData {
  id: string;
  room_number: string;
  name: string;
  room_type: string;
  status: string;
  floor: {
    name: string;
    floor_number: number;
    building: {
      name: string;
    };
  };
}

interface BuildingSummary {
  'Building Name': string;
  'Total Floors': number;
  'Total Rooms': number;
  'Courtrooms': number;
  'Offices': number;
  'Storage': number;
  'Other': number;
}

interface RoomDetail {
  'Building': string;
  'Floor': string;
  'Floor #': number;
  'Room #': string;
  'Room Name': string;
  'Type': string;
  'Status': string;
}

export const exportRoomsSummary = async (): Promise<void> => {
  // Fetch all rooms with floor and building data
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      name,
      room_type,
      status,
      floor:floors!inner (
        name,
        floor_number,
        building:buildings!inner (
          name
        )
      )
    `)
    .order('room_number');

  if (error) {
    throw new Error(`Failed to fetch rooms: ${error.message}`);
  }

  if (!rooms || rooms.length === 0) {
    throw new Error('No rooms found to export');
  }

  // Type assertion for the nested data
  const typedRooms = rooms as unknown as RoomData[];

  // Build summary by building
  const buildingStats = new Map<string, {
    floors: Set<number>;
    total: number;
    courtrooms: number;
    offices: number;
    storage: number;
    other: number;
  }>();

  // Process rooms
  const allRoomsDetail: RoomDetail[] = [];
  const courtroomsOnly: RoomDetail[] = [];

  typedRooms.forEach(room => {
    const buildingName = room.floor?.building?.name || 'Unknown Building';
    const floorName = room.floor?.name || 'Unknown Floor';
    const floorNumber = room.floor?.floor_number || 0;
    const roomType = room.room_type || 'unknown';

    // Update building stats
    if (!buildingStats.has(buildingName)) {
      buildingStats.set(buildingName, {
        floors: new Set(),
        total: 0,
        courtrooms: 0,
        offices: 0,
        storage: 0,
        other: 0,
      });
    }

    const stats = buildingStats.get(buildingName)!;
    stats.floors.add(floorNumber);
    stats.total++;

    if (roomType === 'courtroom') stats.courtrooms++;
    else if (roomType === 'office') stats.offices++;
    else if (roomType === 'storage') stats.storage++;
    else stats.other++;

    // Create room detail row
    const roomDetail: RoomDetail = {
      'Building': buildingName,
      'Floor': floorName,
      'Floor #': floorNumber,
      'Room #': room.room_number || '',
      'Room Name': room.name || '',
      'Type': roomType.charAt(0).toUpperCase() + roomType.slice(1),
      'Status': room.status || 'active',
    };

    allRoomsDetail.push(roomDetail);

    if (roomType === 'courtroom') {
      courtroomsOnly.push(roomDetail);
    }
  });

  // Build summary sheet data
  const buildingSummary: BuildingSummary[] = Array.from(buildingStats.entries())
    .map(([name, stats]) => ({
      'Building Name': name,
      'Total Floors': stats.floors.size,
      'Total Rooms': stats.total,
      'Courtrooms': stats.courtrooms,
      'Offices': stats.offices,
      'Storage': stats.storage,
      'Other': stats.other,
    }))
    .sort((a, b) => a['Building Name'].localeCompare(b['Building Name']));

  // Sort rooms by building, floor, room number
  allRoomsDetail.sort((a, b) => {
    if (a.Building !== b.Building) return a.Building.localeCompare(b.Building);
    if (a['Floor #'] !== b['Floor #']) return a['Floor #'] - b['Floor #'];
    return a['Room #'].localeCompare(b['Room #']);
  });

  courtroomsOnly.sort((a, b) => {
    if (a.Building !== b.Building) return a.Building.localeCompare(b.Building);
    if (a['Floor #'] !== b['Floor #']) return a['Floor #'] - b['Floor #'];
    return a['Room #'].localeCompare(b['Room #']);
  });

  // Generate filename with date
  const today = new Date().toISOString().split('T')[0];
  const filename = `rooms_summary_${today}`;

  // Export multi-sheet Excel
  await exportMultipleSheets(
    [
      { name: 'Building Summary', data: buildingSummary },
      { name: 'All Rooms', data: allRoomsDetail },
      { name: 'Courtrooms Only', data: courtroomsOnly },
    ],
    filename
  );
};
