
// Hallway type definitions

export const HallwaySection = ["left_wing", "right_wing", "connector"] as const;

export const HallwayType = ["public_main", "private"] as const;

export const TrafficFlow = ["one_way", "two_way", "restricted"] as const;

export const Accessibility = ["fully_accessible", "limited_access", "stairs_only", "restricted"] as const;

export const EmergencyRoute = ["primary", "secondary", "not_designated"] as const;

// Type definitions
export type HallwaySectionType = typeof HallwaySection[number];
export type HallwayTypeEnum = typeof HallwayType[number];
export type TrafficFlowType = typeof TrafficFlow[number];
export type AccessibilityType = typeof Accessibility[number];
export type EmergencyRouteType = typeof EmergencyRoute[number];

// Interface for hallway properties
export interface HallwayProperties {
  section?: HallwaySectionType;
  hallwayType?: HallwayTypeEnum;
  trafficFlow?: TrafficFlowType;
  accessibility?: AccessibilityType;
  emergencyRoute?: EmergencyRouteType;
  maintenancePriority?: 'low' | 'medium' | 'high';
  capacityLimit?: number;
  description?: string;
  width?: number;
  length?: number;
  maintenanceSchedule?: MaintenanceEntry[];
  emergencyExits?: EmergencyExit[];
}

export interface MaintenanceEntry {
  date: string;
  type: string;
  status: string;
  assignedTo?: string;
}

export interface EmergencyExit {
  location: string;
  type: string;
  notes?: string;
}
