
export type StandardizedIssueType = 'ACCESS_REQUEST' | 'BUILDING_SYSTEMS' | 'CLEANING_REQUEST' |
  'CLIMATE_CONTROL' | 'ELECTRICAL_NEEDS' | 'GENERAL_REQUESTS' | 'PLUMBING_NEEDS' |
  'STRUCTURAL_REPAIR' | 'FURNITURE_REPAIR' | 'DOOR_LOCK' | 'SAFETY' | 'SECURITY' |
  'IT_TECH' | 'PEST_CONTROL';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export const ISSUE_TYPES: StandardizedIssueType[] = [
  'ACCESS_REQUEST',
  'BUILDING_SYSTEMS',
  'CLEANING_REQUEST',
  'CLIMATE_CONTROL',
  'ELECTRICAL_NEEDS',
  'GENERAL_REQUESTS',
  'PLUMBING_NEEDS',
  'STRUCTURAL_REPAIR',
  'FURNITURE_REPAIR',
  'DOOR_LOCK',
  'SAFETY',
  'SECURITY',
  'IT_TECH',
  'PEST_CONTROL'
] as const;

// Categories that route to the Maintenance workbench (physical building
// upkeep). Security, safety, IT, pest control, cleaning, and access requests
// are tracked as issues too but aren't "maintenance" work, so they're left
// out and stay visible only in the main Issues tab.
export const MAINTENANCE_ISSUE_TYPES = [
  'BUILDING_SYSTEMS',
  'ELECTRICAL_NEEDS',
  'GENERAL_REQUESTS',
  'PLUMBING_NEEDS',
  'STRUCTURAL_REPAIR',
  'CLIMATE_CONTROL',
  'FURNITURE_REPAIR',
  'DOOR_LOCK',
] as const;

export const PROBLEM_TYPES: Record<StandardizedIssueType, string[]> = {
  'ACCESS_REQUEST': ['Card Reader', 'Key Issues', 'Door Access', 'Security Clearance'],
  'BUILDING_SYSTEMS': ['HVAC', 'Electrical', 'Plumbing', 'Security'],
  'CLEANING_REQUEST': ['Regular Service', 'Spill', 'Deep Clean', 'Waste Removal'],
  'CLIMATE_CONTROL': ['Temperature', 'Humidity', 'Ventilation', 'Air Quality'],
  'ELECTRICAL_NEEDS': ['Outlets', 'Lighting', 'Power Issues', 'Wiring'],
  'GENERAL_REQUESTS': ['Maintenance', 'Installation', 'Repair', 'Other'],
  'PLUMBING_NEEDS': ['Leak', 'Clog', 'No Water', 'Water Pressure'],
  'STRUCTURAL_REPAIR': ['Wall Damage', 'Ceiling', 'Door Repair', 'Plastering', 'Painting'],
  'FURNITURE_REPAIR': ['Desk', 'Chair', 'Shelving', 'Cabinet', 'Other Furniture'],
  'DOOR_LOCK': ['Lock Malfunction', 'Broken Door', 'Card Reader', 'Key Issues'],
  'SAFETY': ['Fire Hazard', 'Trip Hazard', 'Emergency Equipment', 'Other'],
  'SECURITY': ['Camera', 'Alarm', 'Unauthorized Access', 'Other'],
  'IT_TECH': ['Network', 'Computer', 'Phone', 'AV Equipment'],
  'PEST_CONTROL': ['Rodents', 'Insects', 'Other']
};

