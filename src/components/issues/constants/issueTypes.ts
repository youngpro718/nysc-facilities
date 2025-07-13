
export type StandardizedIssueType = 'ACCESS_REQUEST' | 'BUILDING_SYSTEMS' | 'CLEANING_REQUEST' | 
  'CLIMATE_CONTROL' | 'ELECTRICAL_NEEDS' | 'GENERAL_REQUESTS' | 'PLUMBING_NEEDS';

export type IssuePriority = 'low' | 'medium' | 'high';

export const ISSUE_TYPES: StandardizedIssueType[] = [
  'ACCESS_REQUEST',
  'BUILDING_SYSTEMS',
  'CLEANING_REQUEST',
  'CLIMATE_CONTROL',
  'ELECTRICAL_NEEDS',
  'GENERAL_REQUESTS',
  'PLUMBING_NEEDS'
] as const;

export const PROBLEM_TYPES: Record<StandardizedIssueType, string[]> = {
  'ACCESS_REQUEST': ['Card Reader', 'Key Issues', 'Door Access', 'Security Clearance'],
  'BUILDING_SYSTEMS': ['HVAC', 'Electrical', 'Plumbing', 'Security'],
  'CLEANING_REQUEST': ['Regular Service', 'Spill', 'Deep Clean', 'Waste Removal'],
  'CLIMATE_CONTROL': ['Temperature', 'Humidity', 'Ventilation', 'Air Quality'],
  'ELECTRICAL_NEEDS': ['Outlets', 'Lighting', 'Power Issues', 'Wiring'],
  'GENERAL_REQUESTS': ['Maintenance', 'Installation', 'Repair', 'Other'],
  'PLUMBING_NEEDS': ['Leak', 'Clog', 'No Water', 'Water Pressure']
};

