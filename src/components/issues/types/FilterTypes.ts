
export type IssueFilters = {
  type?: string;
  status?: "open" | "in_progress" | "resolved" | "all_statuses";
  priority?: string;
  assigned_to?: "DCAS" | "OCA" | "Self" | "Outside_Vendor" | "all_assignments";
  hasOverdue?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
  assignedToMe?: boolean;
  // Lighting-specific filters
  lightingType?: string;
  fixtureStatus?: string;
  electricalIssue?: string;
};

// Alias IssueFilters as IssueFiltersType for consistency
export type IssueFiltersType = IssueFilters;

export type SortOption = {
  field: 'created_at' | 'due_date' | 'priority';
  direction: 'asc' | 'desc';
};

export type GroupingOption = 'none' | 'building' | 'floor';

export type ViewMode = 'cards' | 'table' | 'kanban' | 'timeline';
