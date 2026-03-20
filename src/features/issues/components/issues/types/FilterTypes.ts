
export type IssueFilters = {
  type?: 'all_types' | 'ACCESS_REQUEST' | 'BUILDING_SYSTEMS' | 'CEILING' | 'CLEANING_REQUEST' | 
        'CLIMATE_CONTROL' | 'DOOR' | 'ELECTRICAL_NEEDS' | 'EMERGENCY' | 'EXTERIOR_FACADE' | 
        'FLAGPOLE_FLAG' | 'FLOORING' | 'GENERAL_REQUESTS' | 'LEAK' | 'LIGHTING' | 'LOCK' | 
        'PLUMBING_NEEDS' | 'RESTROOM_REPAIR' | 'SIGNAGE' | 'WINDOW';
  status?: "open" | "in_progress" | "resolved" | "all_statuses" | ["open", "in_progress"];
  priority?: "high" | "medium" | "low" | "all_priorities";
  assigned_to?: "DCAS" | "OCA" | "Self" | "Outside_Vendor" | "all_assignments";
  hasOverdue?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
  assignedToMe?: boolean;
  lightingType?: string;
  fixtureStatus?: string;
  electricalIssue?: string;
};

export type IssueFiltersType = IssueFilters;

export type SortOption = {
  field: 'created_at' | 'due_date' | 'priority';
  direction: 'asc' | 'desc';
};

export type GroupingOption = 'none' | 'building' | 'floor';

export type ViewMode = 'cards' | 'table' | 'kanban' | 'timeline';

