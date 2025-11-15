import { RoomTypeEnum } from "@/components/spaces/rooms/types/roomEnums";

export interface RoomDimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface CapacityCalculationResult {
  recommendedCapacity: number;
  maxOccupancy: number;
  jurorCapacity?: number;
  spectatorCapacity?: number;
  wheelchairSpaces: number;
  reasoning: string;
  utilizationTips: string[];
}

// Standard space allocations per person (in square feet)
const SPACE_STANDARDS = {
  office: 150, // sq ft per person for office work
  courtroom_spectator: 7, // sq ft per spectator (tight seating)
  courtroom_jury: 25, // sq ft per juror (includes table space)
  conference: 25, // sq ft per person around conference table
  break_room: 15, // sq ft per person in break room
  filing: 50, // sq ft per person working in filing area
  default: 35 // default sq ft per person
};

// ADA requirements
const ADA_REQUIREMENTS = {
  wheelchairSpacePercent: 0.02, // 2% of capacity should be wheelchair accessible
  minWheelchairSpaces: 1,
  hearingAssistedPercent: 0.04 // 4% should have hearing assistance
};

export function calculateRoomCapacity(
  roomType: RoomTypeEnum,
  dimensions?: RoomDimensions,
  currentCapacity?: number,
  currentMaxOccupancy?: number
): CapacityCalculationResult {
  
  // If no dimensions provided, use current values or defaults
  if (!dimensions?.length || !dimensions?.width) {
    return {
      recommendedCapacity: currentCapacity || getDefaultCapacityByType(roomType),
      maxOccupancy: currentMaxOccupancy || (currentCapacity || getDefaultCapacityByType(roomType)) + 5,
      wheelchairSpaces: Math.max(1, Math.ceil((currentCapacity || getDefaultCapacityByType(roomType)) * ADA_REQUIREMENTS.wheelchairSpacePercent)),
      reasoning: "Based on room type defaults (no dimensions available)",
      utilizationTips: getUtilizationTips(roomType)
    };
  }

  const floorArea = dimensions.length * dimensions.width;
  
  switch (roomType) {
    case RoomTypeEnum.COURTROOM:
      return calculateCourtroomCapacity(floorArea, dimensions);
    
    case RoomTypeEnum.CONFERENCE_ROOM:
    case RoomTypeEnum.CONFERENCE:
      return calculateConferenceCapacity(floorArea);
    
    case RoomTypeEnum.OFFICE:
    case RoomTypeEnum.ADMINISTRATIVE_OFFICE:
      return calculateOfficeCapacity(floorArea);
    
    case RoomTypeEnum.BREAK_ROOM:
      return calculateBreakRoomCapacity(floorArea);
    
    case RoomTypeEnum.JURY_ROOM:
      return calculateJuryRoomCapacity(floorArea);
    
    default:
      return calculateGeneralCapacity(floorArea, roomType);
  }
}

function calculateCourtroomCapacity(floorArea: number, dimensions: RoomDimensions): CapacityCalculationResult {
  // Courtroom layout: Judge area (100 sq ft), Jury box (200 sq ft), Attorney tables (150 sq ft), 
  // Gallery seating (remaining space)
  const reservedSpace = 450; // sq ft for fixed courtroom elements
  const availableForSeating = Math.max(0, floorArea - reservedSpace);
  
  // Calculate jury capacity (typically 12-16 people)
  const jurorCapacity = Math.min(16, Math.max(12, Math.floor(200 / SPACE_STANDARDS.courtroom_jury)));
  
  // Calculate spectator capacity from remaining space
  const spectatorCapacity = Math.floor(availableForSeating / SPACE_STANDARDS.courtroom_spectator);
  
  const totalCapacity = jurorCapacity + spectatorCapacity + 10; // +10 for court staff, attorneys
  const wheelchairSpaces = Math.max(2, Math.ceil(spectatorCapacity * ADA_REQUIREMENTS.wheelchairSpacePercent));
  
  return {
    recommendedCapacity: totalCapacity,
    maxOccupancy: Math.floor(totalCapacity * 1.1), // 10% buffer for special proceedings
    jurorCapacity,
    spectatorCapacity,
    wheelchairSpaces,
    reasoning: `Based on ${floorArea} sq ft: ${reservedSpace} sq ft for court elements, ${availableForSeating} sq ft for seating`,
    utilizationTips: [
      "Consider jury box configuration for different trial types",
      "Ensure adequate space between gallery rows for accessibility",
      "Reserve front rows for attorneys and court staff",
      "Plan for media seating during high-profile cases"
    ]
  };
}

function calculateConferenceCapacity(floorArea: number): CapacityCalculationResult {
  // Conference room: table + chairs + circulation space
  const capacity = Math.floor(floorArea / SPACE_STANDARDS.conference);
  const wheelchairSpaces = Math.max(1, Math.ceil(capacity * ADA_REQUIREMENTS.wheelchairSpacePercent));
  
  return {
    recommendedCapacity: capacity,
    maxOccupancy: capacity + 2, // Small buffer for observers
    wheelchairSpaces,
    reasoning: `${SPACE_STANDARDS.conference} sq ft per person around conference table`,
    utilizationTips: [
      "Consider U-shape or hollow square for larger groups",
      "Ensure 36\" minimum between chairs and walls",
      "Plan for presentation equipment space"
    ]
  };
}

function calculateOfficeCapacity(floorArea: number): CapacityCalculationResult {
  const capacity = Math.floor(floorArea / SPACE_STANDARDS.office);
  const wheelchairSpaces = Math.max(1, Math.ceil(capacity * ADA_REQUIREMENTS.wheelchairSpacePercent));
  
  return {
    recommendedCapacity: capacity,
    maxOccupancy: capacity + 1,
    wheelchairSpaces,
    reasoning: `${SPACE_STANDARDS.office} sq ft per workstation`,
    utilizationTips: [
      "Consider open vs. private office layouts",
      "Plan for storage and filing space",
      "Ensure adequate lighting for each workstation"
    ]
  };
}

function calculateBreakRoomCapacity(floorArea: number): CapacityCalculationResult {
  const capacity = Math.floor(floorArea / SPACE_STANDARDS.break_room);
  const wheelchairSpaces = Math.max(1, Math.ceil(capacity * ADA_REQUIREMENTS.wheelchairSpacePercent));
  
  return {
    recommendedCapacity: capacity,
    maxOccupancy: Math.floor(capacity * 1.2), // Higher buffer for social gatherings
    wheelchairSpaces,
    reasoning: `${SPACE_STANDARDS.break_room} sq ft per person for dining/socializing`,
    utilizationTips: [
      "Include space for refrigerator, microwave, and counters",
      "Consider both standing and seated areas",
      "Plan for peak usage times"
    ]
  };
}

function calculateJuryRoomCapacity(floorArea: number): CapacityCalculationResult {
  // Jury rooms need space for deliberation table + chairs
  const capacity = Math.min(16, Math.floor(floorArea / SPACE_STANDARDS.courtroom_jury));
  const wheelchairSpaces = Math.max(1, Math.ceil(capacity * ADA_REQUIREMENTS.wheelchairSpacePercent));
  
  return {
    recommendedCapacity: capacity,
    maxOccupancy: capacity, // No buffer - specific jury size
    wheelchairSpaces,
    reasoning: `Jury deliberation requires ${SPACE_STANDARDS.courtroom_jury} sq ft per juror`,
    utilizationTips: [
      "Ensure privacy and soundproofing",
      "Include space for evidence review",
      "Consider separate entrance/exit"
    ]
  };
}

function calculateGeneralCapacity(floorArea: number, roomType: RoomTypeEnum): CapacityCalculationResult {
  const capacity = Math.floor(floorArea / SPACE_STANDARDS.default);
  const wheelchairSpaces = Math.max(1, Math.ceil(capacity * ADA_REQUIREMENTS.wheelchairSpacePercent));
  
  return {
    recommendedCapacity: capacity,
    maxOccupancy: Math.floor(capacity * 1.1),
    wheelchairSpaces,
    reasoning: `General calculation: ${SPACE_STANDARDS.default} sq ft per person`,
    utilizationTips: [
      "Adjust based on specific room function",
      "Consider furniture and equipment needs",
      "Review local fire codes for maximum occupancy"
    ]
  };
}

function getDefaultCapacityByType(roomType: RoomTypeEnum): number {
  switch (roomType) {
    case RoomTypeEnum.COURTROOM:
      return 75;
    case RoomTypeEnum.JURY_ROOM:
      return 16;
    case RoomTypeEnum.CONFERENCE_ROOM:
    case RoomTypeEnum.CONFERENCE:
      return 12;
    case RoomTypeEnum.OFFICE:
    case RoomTypeEnum.ADMINISTRATIVE_OFFICE:
      return 4;
    case RoomTypeEnum.BREAK_ROOM:
      return 20;
    case RoomTypeEnum.CHAMBER:
    case RoomTypeEnum.JUDGES_CHAMBERS:
      return 6;
    default:
      return 10;
  }
}

function getUtilizationTips(roomType: RoomTypeEnum): string[] {
  const commonTips = [
    "Ensure compliance with ADA accessibility requirements",
    "Consider emergency egress requirements",
    "Plan for technology and equipment needs"
  ];
  
  switch (roomType) {
    case RoomTypeEnum.COURTROOM:
      return [
        ...commonTips,
        "Maintain clear sightlines to judge and witness stand",
        "Consider acoustics for all seating areas",
        "Plan for security and controlled access"
      ];
    default:
      return commonTips;
  }
}

// Utility function to format capacity information for display
export function formatCapacityInfo(result: CapacityCalculationResult): string {
  let info = `Recommended: ${result.recommendedCapacity} people`;
  
  if (result.jurorCapacity && result.spectatorCapacity) {
    info += ` (${result.jurorCapacity} jury, ${result.spectatorCapacity} gallery)`;
  }
  
  info += ` • Max: ${result.maxOccupancy}`;
  
  if (result.wheelchairSpaces > 0) {
    info += ` • ${result.wheelchairSpaces} accessible spaces`;
  }
  
  return info;
}
