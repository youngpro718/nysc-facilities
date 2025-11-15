import { format } from "date-fns";

export interface RawAssignmentData {
  id?: string;
  assigned_at?: string;
  is_spare?: boolean;
  occupant_id?: string;
  spare_key_reason?: string | null;
  key_id?: string;
  // Add more fields as needed
}

export interface EnhancedAssignmentData {
  occupant?: {
    id: string;
    first_name: string;
    last_name: string;
    department?: string | null;
    rooms?: Array<{
      name: string;
      room_number: string;
      floors?: {
        name: string;
        buildings?: {
          name: string;
        };
      };
    }>;
  };
  keys?: {
    id: string;
    name: string;
    type: string;
    is_passkey?: boolean;
  };
}

/**
 * Formats raw assignment data into user-friendly text
 */
export function formatAssignmentData(
  rawData: RawAssignmentData, 
  enhancedData?: EnhancedAssignmentData
): string {
  const parts: string[] = [];

  // Key information
  if (enhancedData?.keys?.name) {
    parts.push(`Key: ${enhancedData.keys.name}`);
    if (enhancedData.keys.is_passkey) {
      parts.push("(Passkey)");
    }
  } else if (rawData.key_id) {
    // Skip raw key ID - use key name instead
  }

  // Occupant information
  if (enhancedData?.occupant) {
    const name = `${enhancedData.occupant.first_name} ${enhancedData.occupant.last_name}`;
    parts.push(`Assigned to: ${name}`);
    
    if (enhancedData.occupant.department) {
      parts.push(`Department: ${enhancedData.occupant.department}`);
    }

    // Room information
    const primaryRoom = enhancedData.occupant.rooms?.[0];
    if (primaryRoom) {
      const roomLocation = primaryRoom.floors?.buildings?.name 
        ? `${primaryRoom.floors.buildings.name} - ${primaryRoom.name} (${primaryRoom.room_number})`
        : `${primaryRoom.name} (${primaryRoom.room_number})`;
      parts.push(`Location: ${roomLocation}`);
    }
  } else if (rawData.occupant_id) {
    // Skip raw occupant ID - use occupant name instead
  }

  // Assignment date
  if (rawData.assigned_at) {
    try {
      const formattedDate = format(new Date(rawData.assigned_at), "MMM d, yyyy 'at' h:mm a");
      parts.push(`Assigned: ${formattedDate}`);
    } catch {
      parts.push(`Assigned: ${rawData.assigned_at}`);
    }
  }

  // Spare key information
  if (rawData.is_spare) {
    parts.push("Type: Spare Key");
    if (rawData.spare_key_reason) {
      parts.push(`Reason: ${rawData.spare_key_reason}`);
    }
  }

  return parts.join(" • ");
}

/**
 * Formats assignment data as a structured object for display
 */
export function formatAssignmentStructured(
  rawData: RawAssignmentData,
  enhancedData?: EnhancedAssignmentData
) {
  const result = {
    key: enhancedData?.keys?.name || `Unknown Key`,
    occupant: enhancedData?.occupant 
      ? `${enhancedData.occupant.first_name} ${enhancedData.occupant.last_name}`
      : `Unknown Person`,
    department: enhancedData?.occupant?.department || 'Unknown',
    location: 'Unknown',
    assignedDate: rawData.assigned_at 
      ? format(new Date(rawData.assigned_at), "MMM d, yyyy")
      : 'Unknown',
    isSpare: rawData.is_spare || false,
    spareReason: rawData.spare_key_reason || null
  };

  // Format location
  const primaryRoom = enhancedData?.occupant?.rooms?.[0];
  if (primaryRoom) {
    result.location = primaryRoom.floors?.buildings?.name 
      ? `${primaryRoom.floors.buildings.name} - ${primaryRoom.name} (${primaryRoom.room_number})`
      : `${primaryRoom.name} (${primaryRoom.room_number})`;
  }

  return result;
}