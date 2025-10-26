import { supabase } from '@/lib/supabase';

/**
 * Service to enrich PDF extraction data with real court data from the database
 */

interface CourtRoom {
  id: string;
  room_id: string;
  room_number: string;
  courtroom_number: string;
  is_active: boolean;
}

interface PersonnelProfile {
  id: string;
  display_name: string;
  full_name: string;
  primary_role: string;
  title: string;
  department: string;
}

interface CourtAssignment {
  id: string;
  room_id: string;
  justice: string;
  clerks: string[];
  sergeant: string;
}

interface EnrichmentCache {
  courtRooms: Map<string, CourtRoom>;
  partToRoomMap: Map<string, string>;
  judgeToRoomMap: Map<string, string>;
  personnel: PersonnelProfile[];
  assignments: CourtAssignment[];
}

let enrichmentCache: EnrichmentCache | null = null;

/**
 * Load all necessary data for enrichment
 */
export async function loadEnrichmentData(buildingCode: '100' | '111'): Promise<EnrichmentCache> {
  console.log('📚 Loading enrichment data for building', buildingCode);

  // Load court rooms
  const { data: courtRooms, error: roomsError } = await supabase
    .from('court_rooms')
    .select('id, room_id, room_number, courtroom_number, is_active')
    .order('room_number');

  if (roomsError) {
    console.error('Error loading court rooms:', roomsError);
    throw roomsError;
  }

  // Load personnel profiles
  const { data: personnel, error: personnelError } = await supabase
    .rpc('list_personnel_profiles_minimal');

  if (personnelError) {
    console.warn('Error loading personnel:', personnelError);
  }

  // Load current court assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('court_assignments')
    .select('id, room_id, justice, clerks, sergeant');

  if (assignmentsError) {
    console.warn('Error loading assignments:', assignmentsError);
  }

  // Build lookup maps
  const courtRoomsMap = new Map<string, CourtRoom>();
  const partToRoomMap = new Map<string, string>();
  const judgeToRoomMap = new Map<string, string>();

  (courtRooms || []).forEach(room => {
    courtRoomsMap.set(room.room_number, room);
    
    // Extract part number from courtroom_number (e.g., "Part 22" -> "22")
    const partMatch = room.courtroom_number?.match(/part\s*(\d+)/i);
    if (partMatch) {
      const partNum = partMatch[1];
      partToRoomMap.set(partNum, room.room_number);
    }
  });

  // Build judge to room map from assignments
  (assignments || []).forEach(assignment => {
    if (assignment.justice && assignment.room_id) {
      const room = Array.from(courtRoomsMap.values()).find(r => r.room_id === assignment.room_id);
      if (room) {
        judgeToRoomMap.set(assignment.justice.toLowerCase(), room.room_number);
      }
    }
  });

  const cache: EnrichmentCache = {
    courtRooms: courtRoomsMap,
    partToRoomMap,
    judgeToRoomMap,
    personnel: personnel || [],
    assignments: assignments || []
  };

  enrichmentCache = cache;
  console.log('✅ Enrichment data loaded:', {
    courtRooms: courtRoomsMap.size,
    partMappings: partToRoomMap.size,
    judgeMappings: judgeToRoomMap.size,
    personnel: personnel?.length || 0,
    assignments: assignments?.length || 0
  });

  return cache;
}

/**
 * Find room number from part number
 */
export function findRoomFromPart(partNumber: string, cache?: EnrichmentCache): string {
  const data = cache || enrichmentCache;
  if (!data) return '';

  // Clean part number (remove "Part", spaces, etc.)
  const cleanPart = partNumber.replace(/part/i, '').trim();
  
  // Try direct lookup
  const roomNumber = data.partToRoomMap.get(cleanPart);
  if (roomNumber) {
    console.log(`✓ Found room ${roomNumber} for part ${cleanPart}`);
    return roomNumber;
  }

  console.log(`✗ No room mapping found for part ${cleanPart}`);
  return '';
}

/**
 * Find room number from judge name
 */
export function findRoomFromJudge(judgeName: string, cache?: EnrichmentCache): string {
  const data = cache || enrichmentCache;
  if (!data) return '';

  const cleanJudge = judgeName.toLowerCase().trim();
  
  // Try direct lookup
  const roomNumber = data.judgeToRoomMap.get(cleanJudge);
  if (roomNumber) {
    console.log(`✓ Found room ${roomNumber} for judge ${judgeName}`);
    return roomNumber;
  }

  // Try partial match
  for (const [judge, room] of data.judgeToRoomMap.entries()) {
    if (judge.includes(cleanJudge) || cleanJudge.includes(judge)) {
      console.log(`✓ Found room ${room} for judge ${judgeName} (partial match)`);
      return room;
    }
  }

  console.log(`✗ No room mapping found for judge ${judgeName}`);
  return '';
}

/**
 * Find best matching judge name from personnel database
 */
export function findJudgeName(extractedName: string, cache?: EnrichmentCache): string {
  const data = cache || enrichmentCache;
  if (!data || !data.personnel) return extractedName;

  const cleanExtracted = extractedName.toLowerCase().trim();
  
  // Filter to judges only
  const judges = data.personnel.filter(p => {
    const role = (p.primary_role || p.title || '').toLowerCase();
    return role.includes('judge') || role.includes('justice');
  });

  // Try exact match on display name
  for (const judge of judges) {
    const displayName = (judge.display_name || '').toLowerCase();
    if (displayName === cleanExtracted) {
      console.log(`✓ Exact match: ${judge.display_name}`);
      return judge.display_name || judge.full_name;
    }
  }

  // Try partial match (last name)
  for (const judge of judges) {
    const displayName = (judge.display_name || '').toLowerCase();
    const fullName = (judge.full_name || '').toLowerCase();
    
    if (displayName.includes(cleanExtracted) || cleanExtracted.includes(displayName) ||
        fullName.includes(cleanExtracted) || cleanExtracted.includes(fullName)) {
      console.log(`✓ Partial match: ${judge.display_name || judge.full_name}`);
      return judge.display_name || judge.full_name;
    }
  }

  console.log(`✗ No judge match found for "${extractedName}"`);
  return extractedName;
}

/**
 * Find clerk name from personnel database
 */
export function findClerkName(extractedName: string, cache?: EnrichmentCache): string {
  const data = cache || enrichmentCache;
  if (!data || !data.personnel) return extractedName;

  const cleanExtracted = extractedName.toLowerCase().trim();
  
  // Filter to clerks only
  const clerks = data.personnel.filter(p => {
    const role = (p.primary_role || p.title || '').toLowerCase();
    return role.includes('clerk');
  });

  // Try exact match
  for (const clerk of clerks) {
    const displayName = (clerk.display_name || '').toLowerCase();
    if (displayName === cleanExtracted) {
      return clerk.display_name || clerk.full_name;
    }
  }

  // Try partial match
  for (const clerk of clerks) {
    const displayName = (clerk.display_name || '').toLowerCase();
    const fullName = (clerk.full_name || '').toLowerCase();
    
    if (displayName.includes(cleanExtracted) || cleanExtracted.includes(displayName) ||
        fullName.includes(cleanExtracted) || cleanExtracted.includes(fullName)) {
      return clerk.display_name || clerk.full_name;
    }
  }

  return extractedName;
}

/**
 * Get clerk for a specific room from assignments
 */
export function getClerkForRoom(roomNumber: string, cache?: EnrichmentCache): string {
  const data = cache || enrichmentCache;
  if (!data) return '';

  const room = data.courtRooms.get(roomNumber);
  if (!room) return '';

  const assignment = data.assignments.find(a => a.room_id === room.room_id);
  if (!assignment || !assignment.clerks || assignment.clerks.length === 0) {
    return '';
  }

  // Return first clerk
  return assignment.clerks[0];
}

/**
 * Enrich extracted session data with database information
 */
export interface ExtractedSession {
  part_number: string;
  judge_name: string;
  calendar_day?: string;
  room_number?: string;
  clerk_name?: string;
  cases?: any[];
  confidence?: number;
}

export async function enrichSessionData(
  sessions: ExtractedSession[],
  buildingCode: '100' | '111'
): Promise<ExtractedSession[]> {
  console.log(`🔄 Enriching ${sessions.length} sessions with database data...`);

  // Load enrichment data if not cached
  if (!enrichmentCache) {
    await loadEnrichmentData(buildingCode);
  }

  const enriched = sessions.map(session => {
    const enrichedSession = { ...session };

    // 1. Find room number from part or judge
    if (!enrichedSession.room_number) {
      enrichedSession.room_number = findRoomFromPart(session.part_number) ||
                                     findRoomFromJudge(session.judge_name);
    }

    // 2. Normalize judge name
    if (enrichedSession.judge_name) {
      enrichedSession.judge_name = findJudgeName(enrichedSession.judge_name);
    }

    // 3. Find clerk for the room
    if (!enrichedSession.clerk_name && enrichedSession.room_number) {
      enrichedSession.clerk_name = getClerkForRoom(enrichedSession.room_number);
    }

    // 4. Increase confidence if we found room number
    if (enrichedSession.room_number && enrichedSession.confidence) {
      enrichedSession.confidence = Math.min(enrichedSession.confidence + 0.1, 0.95);
    }

    console.log(`  Part ${session.part_number}: Room=${enrichedSession.room_number}, Judge=${enrichedSession.judge_name}, Clerk=${enrichedSession.clerk_name}`);

    return enrichedSession;
  });

  console.log('✅ Enrichment complete');
  return enriched;
}

/**
 * Clear the enrichment cache (useful when data changes)
 */
export function clearEnrichmentCache() {
  enrichmentCache = null;
  console.log('🗑️ Enrichment cache cleared');
}
