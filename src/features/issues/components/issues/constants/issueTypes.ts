
export type StandardizedIssueType = 'ACCESS_REQUEST' | 'BUILDING_SYSTEMS' | 'CLEANING_REQUEST' | 
  'CLIMATE_CONTROL' | 'ELECTRICAL_NEEDS' | 'GENERAL_REQUESTS' | 'PLUMBING_NEEDS' | 
  'STRUCTURAL_REPAIR' | 'FURNITURE_REPAIR';

export type IssuePriority = 'low' | 'medium' | 'high';

export const ISSUE_TYPES: StandardizedIssueType[] = [
  'ACCESS_REQUEST',
  'BUILDING_SYSTEMS',
  'CLEANING_REQUEST',
  'CLIMATE_CONTROL',
  'ELECTRICAL_NEEDS',
  'GENERAL_REQUESTS',
  'PLUMBING_NEEDS',
  'STRUCTURAL_REPAIR',
  'FURNITURE_REPAIR'
] as const;

export const MAINTENANCE_ISSUE_TYPES = ['BUILDING_SYSTEMS', 'ELECTRICAL_NEEDS', 'GENERAL_REQUESTS'] as const;

export const PROBLEM_TYPES: Record<StandardizedIssueType, string[]> = {
  'ACCESS_REQUEST': ['Card Reader', 'Key Issues', 'Door Access', 'Security Clearance'],
  'BUILDING_SYSTEMS': ['HVAC', 'Electrical', 'Plumbing', 'Security'],
  'CLEANING_REQUEST': ['Regular Service', 'Spill', 'Deep Clean', 'Waste Removal'],
  'CLIMATE_CONTROL': ['Temperature', 'Humidity', 'Ventilation', 'Air Quality'],
  'ELECTRICAL_NEEDS': ['Outlets', 'Lighting', 'Power Issues', 'Wiring'],
  'GENERAL_REQUESTS': ['Maintenance', 'Installation', 'Repair', 'Other'],
  'PLUMBING_NEEDS': ['Leak', 'Clog', 'No Water', 'Water Pressure'],
  'STRUCTURAL_REPAIR': ['Wall Damage', 'Ceiling', 'Door Repair', 'Plastering', 'Painting'],
  'FURNITURE_REPAIR': ['Desk', 'Chair', 'Shelving', 'Cabinet', 'Other Furniture']
};

