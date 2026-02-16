// @ts-nocheck
/**
 * Court room mapping utility for building 111 based on part numbers
 * 
 * NOTE: This is a legacy static mapping. The new dynamic mapping system
 * in src/services/court/courtroomMappingService.ts queries the database
 * for accurate, up-to-date courtroom assignments.
 * 
 * This file is kept for backward compatibility with existing code.
 */

export function mapPartToRoom(partNumber: string, buildingCode: '100' | '111'): string {
  logger.warn('⚠️ Using legacy static part mapping. Consider migrating to courtroomMappingService.ts for database-driven mapping.');
  
  // For building 111, we have some known part-to-room mappings
  if (buildingCode === '111') {
    const partNum = partNumber.toUpperCase().replace(/[^0-9A-Z]/g, '');
    
    // Common mappings for building 111
    // These are static fallbacks and may be outdated
    const roomMapping: Record<string, string> = {
      'PART1': '1000',
      'PART2': '1100',
      'PART3': '1200',
      'PART4': '1300',
      'PART5': '1400',
      'PART6': '1500',
      'PART7': '1600',
      'PART8': '1700',
      'PART9': '1800',
      'PART10': '1900',
      'PART11': '2000',
      'PART12': '2100',
      'PART13': '2200',
      'PART14': '2300',
      'PART15': '2400',
      'PART16': '2500',
      'PART17': '2600',
      'PART18': '2700',
      'PART19': '2800',
      'PART20': '2900',
      'PART21': '1315',
      'PART22': '1417',
      'PART23': '1537',
      'PART24': '1639',
      'PART25': '1741',
      'PART26': '1843',
      'PART27': '1945',
      'PART28': '2047',
      'PART29': '2149',
      'PART30': '2251',
      'PART31': '2353',
      'PART32': '2455',
      'PART33': '2557',
      'PART34': '2659',
      'PART35': '2761',
      'PART36': '2863',
      'PART37': '2965',
      'PART38': '3067',
      'PART39': '3169',
      'PART40': '3271',
    };
    
    return roomMapping[partNum] || '';
  }
  
  // For building 100, return empty (would need different mapping)
  return '';
}
