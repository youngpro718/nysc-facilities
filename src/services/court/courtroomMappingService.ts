import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface CourtroomMapping {
  part_number: string;
  room_number: string;
  room_name: string;
  room_id: string;
  courtroom_id: string;
  building_address: string;
  building_code: '100' | '111';
  confidence: number;
}

/**
 * Map a part number to a courtroom in the database
 */
export async function mapPartToCourtroom(
  partNumber: string,
  buildingCode: '100' | '111'
): Promise<CourtroomMapping | null> {
  logger.debug(`🔍 Mapping part "${partNumber}" to courtroom in building ${buildingCode}`);

  // Clean and normalize part number
  const cleanPart = normalizePartNumber(partNumber);
  
  // Query courtrooms with building filter
  const { data: courtRooms, error } = await supabase
    .from('court_rooms')
    .select(`
      id,
      room_id,
      room_number,
      courtroom_number,
      rooms!inner(
        id,
        name,
        floors!inner(
          building_id,
          buildings!inner(
            address,
            name
          )
        )
      )
    `);

  if (error) {
    logger.error('Error querying courtrooms:', error);
    return null;
  }

  if (!courtRooms || courtRooms.length === 0) {
    logger.debug('No courtrooms found in database');
    return null;
  }

  // Filter by building
  const buildingFiltered = courtRooms.filter((cr: Record<string, unknown>) => {
    const address = cr.rooms?.floors?.buildings?.address || '';
    return address.includes(`${buildingCode} Centre`);
  });

  // Try different matching strategies
  const matches = [
    ...findExactMatches(cleanPart, buildingFiltered),
    ...findPartialMatches(cleanPart, buildingFiltered),
    ...findSpecialFormatMatches(partNumber, buildingFiltered),
  ];

  if (matches.length === 0) {
    logger.debug(`❌ No courtroom found for part ${partNumber}`);
    return null;
  }

  // Return best match
  const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
  logger.debug(`✅ Mapped part ${partNumber} to room ${bestMatch.room_number} (confidence: ${bestMatch.confidence})`);
  
  return bestMatch;
}

/**
 * Normalize part number for matching
 */
function normalizePartNumber(partNumber: string): string {
  return partNumber
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/PART\s*/i, '')
    .replace(/PT\s*/i, '')
    .trim();
}

/**
 * Find exact matches (highest confidence)
 */
function findExactMatches(cleanPart: string, courtRooms: unknown[]): CourtroomMapping[] {
  const matches: CourtroomMapping[] = [];

  for (const cr of courtRooms) {
    const courtroomNum = (cr.courtroom_number || '').toUpperCase();
    const roomName = (cr.rooms?.name || '').toUpperCase();
    
    // Exact match on courtroom_number
    if (courtroomNum.includes(`PART ${cleanPart}`) || courtroomNum === cleanPart) {
      matches.push(createMapping(cr, 0.95));
      continue;
    }
    
    // Exact match on room name
    if (roomName.includes(`PART ${cleanPart}`) || roomName === `PART ${cleanPart}`) {
      matches.push(createMapping(cr, 0.90));
    }
  }

  return matches;
}

/**
 * Find partial matches (medium confidence)
 */
function findPartialMatches(cleanPart: string, courtRooms: unknown[]): CourtroomMapping[] {
  const matches: CourtroomMapping[] = [];

  // Extract numeric part if exists
  const numMatch = cleanPart.match(/(\d+)/);
  if (!numMatch) return matches;
  
  const partNum = numMatch[1];

  for (const cr of courtRooms) {
    const courtroomNum = (cr.courtroom_number || '').toUpperCase();
    const roomName = (cr.rooms?.name || '').toUpperCase();
    
    // Partial numeric match
    if (courtroomNum.includes(partNum) || roomName.includes(partNum)) {
      matches.push(createMapping(cr, 0.75));
    }
  }

  return matches;
}

/**
 * Find special format matches (TAP A, PT 75, RTA-73)
 */
function findSpecialFormatMatches(originalPart: string, courtRooms: unknown[]): CourtroomMapping[] {
  const matches: CourtroomMapping[] = [];
  const upperPart = originalPart.toUpperCase();

  for (const cr of courtRooms) {
    const courtroomNum = (cr.courtroom_number || '').toUpperCase();
    const roomName = (cr.rooms?.name || '').toUpperCase();
    
    // Handle TAP A, TAP B, etc.
    if (upperPart.includes('TAP')) {
      const searchVariants = [
        upperPart,
        upperPart.replace(/\s+/g, ''),  // "TAPA"
        upperPart.replace(/\s+/g, '-'), // "TAP-A"
      ];
      
      for (const variant of searchVariants) {
        if (courtroomNum.includes(variant) || roomName.includes(variant)) {
          matches.push(createMapping(cr, 0.85));
          break;
        }
      }
    }
    
    // Handle PT 75, RTA-73, etc.
    if (upperPart.includes('PT') || upperPart.includes('RTA')) {
      const searchVariants = [
        upperPart,
        upperPart.replace(/\s+/g, ''),
        upperPart.replace(/\s+/g, '-'),
        upperPart.replace('PT', 'PART'),
      ];
      
      for (const variant of searchVariants) {
        if (courtroomNum.includes(variant) || roomName.includes(variant)) {
          matches.push(createMapping(cr, 0.80));
          break;
        }
      }
    }
  }

  return matches;
}

/**
 * Create mapping object from court room data
 */
function createMapping(cr: Record<string, unknown>, confidence: number): CourtroomMapping {
  const building = cr.rooms?.floors?.buildings;
  const buildingCode = building?.address?.includes('111') ? '111' : '100';
  
  return {
    part_number: cr.courtroom_number || '',
    room_number: cr.room_number,
    room_name: cr.rooms?.name || '',
    room_id: cr.room_id,
    courtroom_id: cr.id,
    building_address: building?.address || '',
    building_code: buildingCode as '100' | '111',
    confidence,
  };
}

/**
 * Batch map multiple parts to courtrooms
 */
export async function batchMapPartsToCourtrooms(
  parts: Array<{ part_number: string; building_code: '100' | '111' }>
): Promise<Map<string, CourtroomMapping>> {
  const mappings = new Map<string, CourtroomMapping>();
  
  logger.debug(`🔄 Batch mapping ${parts.length} parts...`);
  
  // Process all parts in parallel
  const results = await Promise.all(
    parts.map(p => mapPartToCourtroom(p.part_number, p.building_code))
  );
  
  parts.forEach((part, index) => {
    const mapping = results[index];
    if (mapping) {
      mappings.set(part.part_number, mapping);
    }
  });
  
  logger.debug(`✅ Mapped ${mappings.size} of ${parts.length} parts`);
  
  return mappings;
}
