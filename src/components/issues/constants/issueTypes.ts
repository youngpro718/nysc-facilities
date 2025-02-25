
export type StandardizedIssueType = 'ACCESS_REQUEST' | 'BUILDING_SYSTEMS' | 'CEILING' | 'CLEANING_REQUEST' | 
  'CLIMATE_CONTROL' | 'DOOR' | 'ELECTRICAL_NEEDS' | 'EMERGENCY' | 'EXTERIOR_FACADE' | 
  'FLAGPOLE_FLAG' | 'FLOORING' | 'GENERAL_REQUESTS' | 'LEAK' | 'LIGHTING' | 'LOCK' | 
  'PLUMBING_NEEDS' | 'RESTROOM_REPAIR' | 'SIGNAGE' | 'WINDOW';

export type IssuePriority = 'low' | 'medium' | 'high';

export const ISSUE_TYPES: StandardizedIssueType[] = [
  'ACCESS_REQUEST',
  'BUILDING_SYSTEMS',
  'CLIMATE_CONTROL',
  'CLEANING_REQUEST',
  'ELECTRICAL_NEEDS',
  'GENERAL_REQUESTS',
  'PLUMBING_NEEDS'
] as const;

export const PROBLEM_TYPES: Record<StandardizedIssueType, string[]> = {
  'ACCESS_REQUEST': ['Card Reader', 'Key Issues', 'Door Access', 'Security Clearance'],
  'BUILDING_SYSTEMS': ['HVAC', 'Electrical', 'Plumbing', 'Security'],
  'CEILING': ['Tiles', 'Leaks', 'Lighting', 'Vents'],
  'CLEANING_REQUEST': ['Regular Service', 'Spill', 'Deep Clean', 'Waste Removal'],
  'CLIMATE_CONTROL': ['Temperature', 'Humidity', 'Ventilation', 'Air Quality'],
  'DOOR': ["Won't Lock", "Won't Close", 'Handle Broken', 'Card Reader'],
  'ELECTRICAL_NEEDS': ['Outlets', 'Lighting', 'Power Issues', 'Wiring'],
  'EMERGENCY': ['Fire', 'Flood', 'Security', 'Medical'],
  'EXTERIOR_FACADE': ['Windows', 'Walls', 'Signage', 'Structural'],
  'FLAGPOLE_FLAG': ['Repair', 'Replacement', 'Installation', 'Lighting'],
  'FLOORING': ['Carpet', 'Tile', 'Wood', 'Safety Hazard'],
  'GENERAL_REQUESTS': ['Maintenance', 'Installation', 'Repair', 'Other'],
  'LEAK': ['Water', 'Gas', 'Ceiling', 'Pipe'],
  'LIGHTING': ['Bulb Out', 'Fixture', 'Emergency Light', 'Controls'],
  'LOCK': ['Key', 'Electronic', 'Broken', 'Replacement'],
  'PLUMBING_NEEDS': ['Leak', 'Clog', 'No Water', 'Water Pressure'],
  'RESTROOM_REPAIR': ['Fixture', 'Plumbing', 'Supplies', 'Cleaning'],
  'SIGNAGE': ['New', 'Repair', 'Update', 'Remove'],
  'WINDOW': ['Broken', 'Seal', 'Lock', 'Screen']
};

