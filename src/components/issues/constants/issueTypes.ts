
export type IssuePriority = 'low' | 'medium' | 'high';
export type IssueType = 'Power' | 'Plumbing' | 'HVAC' | 'Door' | 'Cleaning' | 'Pest Control' | 'Other';

export const ISSUE_TYPES = [
  'Power',
  'Plumbing',
  'HVAC',
  'Door',
  'Cleaning',
  'Pest Control',
  'Other'
] as const;

export const PROBLEM_TYPES: Record<IssueType, string[]> = {
  'Power': ['Circuit Breaker', 'Outlet Not Working', 'Light Fixture', 'Emergency Power'],
  'Plumbing': ['Leak', 'Clog', 'No Water', 'Water Pressure'],
  'HVAC': ['No Heat', 'No Cooling', 'Strange Noise', 'Thermostat Issue'],
  'Door': ["Won't Lock", "Won't Close", 'Handle Broken', 'Card Reader'],
  'Cleaning': ['Regular Service', 'Spill', 'Deep Clean Required', 'Waste Removal'],
  'Pest Control': ['Rodents', 'Insects', 'Prevention', 'Inspection'],
  'Other': ['General Maintenance', 'Inspection', 'Consultation']
};
