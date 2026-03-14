// Courtroom Mapping Service
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Aliases for parts that map to the same courtroom
const PART_ALIASES: Record<string, string> = {
  'TAP G': 'TAP A',
  'TAP A / TAP G': 'TAP A',
};

/**
 * Resolve a part name through the alias map.
 * Handles compound parts like "TAP A / TAP G" by checking the full string first,
 * then each individual segment.
 */
function resolveAlias(partNumber: string): string {
  const upper = partNumber.toUpperCase().trim();
  // Check full string first
  if (PART_ALIASES[upper]) return PART_ALIASES[upper];
  // Check if it's a compound part (e.g. "TAP A / TAP G")
  if (upper.includes('/')) {
    const segments = upper.split('/').map(s => s.trim());
    for (const seg of segments) {
      if (PART_ALIASES[seg]) return PART_ALIASES[seg];
    }
    // Return the first segment if no alias found
    return segments[0];
  }
  return partNumber;
}

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
  // Resolve aliases (e.g. TAP G → TAP A)
  const resolvedPart = resolveAlias(partNumber);
  logger.debug(`🔍 Mapping part "${partNumber}"${resolvedPart !== partNumber ? ` (resolved → "${resolvedPart}")` : ''} to courtroom in building ${buildingCode}`);

  // Clean and normalize part number
  const cleanPart = normalizePartNumber(resolvedPart);
  
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
  const buildingFiltered = courtRooms.filter((cr: any) => {
    const address = cr.rooms?.floors?.buildings?.address || '';
    return address.includes(`${buildingCode} Centre`);
  });

  // Try different matching strategies
  const matches = [
    ...findExactMatches(cleanPart, buildingFiltered),
    ...findPartialMatches(cleanPart, buildingFiltered),
    ...findSpecialFormatMatches(resolvedPart, buildingFiltered),
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
function findExactMatches(cleanPart: string, courtRooms: any[]): CourtroomMapping[] {
  const matches: CourtroomMapping[] = [];

  for (const cr of courtRooms) {
    const courtroomNum = (cr.courtroom_number || '').toUpperCase();
    const roomName = (cr.rooms?.name || '').toUpperCase();
    
    // Exact match on courtroom_number
    if (courtroomNum.includes(`PART ${cleanPart}`) || courtroomNum === cleanPart) {
      matches.push(createMapping(cr, 0.95));
      continue;
    }
    
    // Exact match on room name (e.g. "PART 41" or directly "IDV", "ATI")
    if (roomName.includes(`PART ${cleanPart}`) || roomName === `PART ${cleanPart}` || roomName === cleanPart) {
      matches.push(createMapping(cr, 0.90));
    }
  }

  return matches;
}

/**
 * Find partial matches (medium confidence)
 * Only for purely numeric parts (e.g. "32", "41").
 * Alphanumeric parts like "1A" are skipped to prevent false matches
 * (e.g. "1A" extracting "1" and matching "PART 41").
 */
function findPartialMatches(cleanPart: string, courtRooms: any[]): CourtroomMapping[] {
  const matches: CourtroomMapping[] = [];

  // Skip alphanumeric parts — only pure numbers get partial matching
  if (/[A-Z]/i.test(cleanPart)) return matches;

  // Extract numeric part if exists
  const numMatch = cleanPart.match(/^(\d+)$/);
  if (!numMatch) return matches;
  
  const partNum = numMatch[1];
  // Use word-boundary regex to avoid "1" matching inside "41", "51", etc.
  const partNumRegex = new RegExp(`\\b${partNum}\\b`);

  for (const cr of courtRooms) {
    const courtroomNum = (cr.courtroom_number || '').toUpperCase();
    const roomName = (cr.rooms?.name || '').toUpperCase();
    
    // Word-boundary numeric match
    if (partNumRegex.test(courtroomNum) || partNumRegex.test(roomName)) {
      matches.push(createMapping(cr, 0.75));
    }
  }

  return matches;
}

/**
 * Find special format matches (TAP A, PT 75, RTA-73)
 */
function findSpecialFormatMatches(originalPart: string, courtRooms: any[]): CourtroomMapping[] {
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

    // Handle special part identifiers: ATI, IDV, JHO, MDC
    // DB names may have suffixes like "JHO PART/66", "MDC-92"
    const SPECIAL_PARTS = ['ATI', 'IDV', 'JHO', 'MDC'];
    if (SPECIAL_PARTS.includes(upperPart)) {
      if (roomName === upperPart || roomName.startsWith(`${upperPart} `) || roomName.startsWith(`${upperPart}-`)) {
        matches.push(createMapping(cr, 0.90));
      }
    }
  }

  return matches;
}

/**
 * Create mapping object from court room data
 */
function createMapping(cr: any, confidence: number): CourtroomMapping {
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
