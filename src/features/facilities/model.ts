/**
 * Facilities Feature Model
 * 
 * Central model file for the Facilities feature containing:
 * - Type definitions
 * - Enums and constants
 * - Validation schemas
 * - Business logic utilities
 * 
 * @module features/facilities/model
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Building {
  id: string;
  name: string;
  address?: string;
  total_floors?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  name?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  building?: Building;
}

export interface Room {
  id: string;
  building_id: string;
  floor_id: string;
  room_number: string;
  room_name?: string;
  name?: string; // Alias for room_name for compatibility
  room_type?: RoomType;
  status: RoomStatus;
  capacity?: number;
  area_sqft?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  building?: Building;
  floor?: Floor;
  occupants?: Occupant[];
  current_occupants?: unknown[]; // Current room occupants
  issues?: unknown[]; // Related issues
  room_history?: unknown[]; // Room history records
  notes?: string; // Room notes
}

export interface Occupant {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  email?: string;
}

export interface RoomFilters {
  buildingId?: string;
  floorId?: string;
  type?: RoomType;
  status?: RoomStatus;
  search?: string;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  CLOSED = 'closed',
  UNDER_CONSTRUCTION = 'under_construction',
}

export enum RoomType {
  OFFICE = 'office',
  COURTROOM = 'courtroom',
  CONFERENCE = 'conference',
  STORAGE = 'storage',
  RESTROOM = 'restroom',
  COMMON = 'common',
  MECHANICAL = 'mechanical',
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: 'Available',
  [RoomStatus.OCCUPIED]: 'Occupied',
  [RoomStatus.MAINTENANCE]: 'Maintenance',
  [RoomStatus.RESERVED]: 'Reserved',
  [RoomStatus.CLOSED]: 'Closed',
  [RoomStatus.UNDER_CONSTRUCTION]: 'Under Construction',
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: 'bg-green-100 text-green-800',
  [RoomStatus.OCCUPIED]: 'bg-blue-100 text-blue-800',
  [RoomStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
  [RoomStatus.RESERVED]: 'bg-purple-100 text-purple-800',
  [RoomStatus.CLOSED]: 'bg-red-100 text-red-800',
  [RoomStatus.UNDER_CONSTRUCTION]: 'bg-orange-100 text-orange-800',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.OFFICE]: 'Office',
  [RoomType.COURTROOM]: 'Courtroom',
  [RoomType.CONFERENCE]: 'Conference Room',
  [RoomType.STORAGE]: 'Storage',
  [RoomType.RESTROOM]: 'Restroom',
  [RoomType.COMMON]: 'Common Area',
  [RoomType.MECHANICAL]: 'Mechanical',
};

// ============================================================================
// BUSINESS LOGIC UTILITIES
// ============================================================================

/**
 * Get room display name (room_name or room_number)
 */
export function getRoomDisplayName(room: Room): string {
  return room.room_name || room.room_number;
}

/**
 * Get full room identifier (building + floor + room)
 */
export function getRoomFullIdentifier(room: Room): string {
  const building = room.building?.name || 'Unknown Building';
  const floor = room.floor?.name || `Floor ${room.floor?.floor_number || '?'}`;
  const roomName = getRoomDisplayName(room);
  return `${building} - ${floor} - ${roomName}`;
}

/**
 * Check if room is available for assignment
 */
export function isRoomAvailable(room: Room): boolean {
  return room.status === RoomStatus.AVAILABLE;
}

/**
 * Check if room requires maintenance
 */
export function isRoomInMaintenance(room: Room): boolean {
  return room.status === RoomStatus.MAINTENANCE;
}

/**
 * Get room status badge classes
 */
export function getRoomStatusBadgeClass(status: RoomStatus): string {
  return ROOM_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get room status label
 */
export function getRoomStatusLabel(status: RoomStatus): string {
  return ROOM_STATUS_LABELS[status] || status;
}

/**
 * Get room type label
 */
export function getRoomTypeLabel(type: RoomType): string {
  return ROOM_TYPE_LABELS[type] || type;
}

/**
 * Check if room is at capacity
 */
export function isRoomAtCapacity(room: Room, currentOccupants: number): boolean {
  if (!room.capacity) return false;
  return currentOccupants >= room.capacity;
}

/**
 * Calculate room occupancy percentage
 */
export function getRoomOccupancyPercentage(room: Room, currentOccupants: number): number {
  if (!room.capacity || room.capacity === 0) return 0;
  return Math.round((currentOccupants / room.capacity) * 100);
}

/**
 * Filter rooms by search query
 */
export function filterRoomsBySearch(rooms: Room[], searchQuery: string): Room[] {
  if (!searchQuery.trim()) return rooms;
  
  const query = searchQuery.toLowerCase();
  return rooms.filter(room => 
    room.room_number.toLowerCase().includes(query) ||
    room.room_name?.toLowerCase().includes(query) ||
    room.building?.name.toLowerCase().includes(query)
  );
}

/**
 * Sort rooms by room number
 */
export function sortRoomsByNumber(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    // Extract numeric part for proper sorting
    const aNum = parseInt(a.room_number.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.room_number.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });
}

/**
 * Group rooms by floor
 */
export function groupRoomsByFloor(rooms: Room[]): Map<string, Room[]> {
  const grouped = new Map<string, Room[]>();
  
  rooms.forEach(room => {
    const floorKey = room.floor?.id || 'unknown';
    if (!grouped.has(floorKey)) {
      grouped.set(floorKey, []);
    }
    grouped.get(floorKey)!.push(room);
  });
  
  return grouped;
}

/**
 * Group rooms by building
 */
export function groupRoomsByBuilding(rooms: Room[]): Map<string, Room[]> {
  const grouped = new Map<string, Room[]>();
  
  rooms.forEach(room => {
    const buildingKey = room.building?.id || 'unknown';
    if (!grouped.has(buildingKey)) {
      grouped.set(buildingKey, []);
    }
    grouped.get(buildingKey)!.push(room);
  });
  
  return grouped;
}

/**
 * Get available room statuses for transition
 */
export function getAvailableStatusTransitions(currentStatus: RoomStatus): RoomStatus[] {
  // Define valid status transitions
  const transitions: Record<RoomStatus, RoomStatus[]> = {
    [RoomStatus.AVAILABLE]: [
      RoomStatus.OCCUPIED,
      RoomStatus.RESERVED,
      RoomStatus.MAINTENANCE,
      RoomStatus.CLOSED,
    ],
    [RoomStatus.OCCUPIED]: [
      RoomStatus.AVAILABLE,
      RoomStatus.MAINTENANCE,
      RoomStatus.CLOSED,
    ],
    [RoomStatus.MAINTENANCE]: [
      RoomStatus.AVAILABLE,
      RoomStatus.CLOSED,
    ],
    [RoomStatus.RESERVED]: [
      RoomStatus.AVAILABLE,
      RoomStatus.OCCUPIED,
      RoomStatus.CLOSED,
    ],
    [RoomStatus.CLOSED]: [
      RoomStatus.AVAILABLE,
      RoomStatus.MAINTENANCE,
      RoomStatus.UNDER_CONSTRUCTION,
    ],
    [RoomStatus.UNDER_CONSTRUCTION]: [
      RoomStatus.AVAILABLE,
      RoomStatus.CLOSED,
    ],
  };
  
  return transitions[currentStatus] || [];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate room number format
 */
export function isValidRoomNumber(roomNumber: string): boolean {
  // Room numbers should be alphanumeric, may contain hyphens or spaces
  return /^[A-Za-z0-9\s\-]+$/.test(roomNumber);
}

/**
 * Validate room capacity
 */
export function isValidCapacity(capacity: number): boolean {
  return capacity > 0 && capacity <= 1000; // Reasonable max capacity
}

/**
 * Validate room area
 */
export function isValidArea(area: number): boolean {
  return area > 0 && area <= 100000; // Reasonable max area in sqft
}
