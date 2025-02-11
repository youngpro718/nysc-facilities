
export type IssueType = 
  | "ACCESS_REQUEST"
  | "BUILDING_SYSTEMS"
  | "CEILING"
  | "CLEANING_REQUEST"
  | "CLIMATE_CONTROL"
  | "DOOR"
  | "ELECTRICAL_NEEDS"
  | "EMERGENCY"
  | "EXTERIOR_FACADE"
  | "FLAGPOLE_FLAG"
  | "FLOORING"
  | "GENERAL_REQUESTS"
  | "LEAK"
  | "LIGHTING"
  | "LOCK"
  | "PLUMBING_NEEDS"
  | "RESTROOM_REPAIR"
  | "SIGNAGE"
  | "WINDOW";

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: string;
  assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
  type: IssueType;
  created_at: string;
  subcategory?: string;
  template_fields?: Record<string, any>;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  photos?: string[];
  fixture_id?: string;
  due_date?: string;
  area_affected?: string;
  additional_stakeholders?: string[];
  related_issues?: string[];
  maintenance_priority?: "low" | "medium" | "high";
  inspection_schedule?: string;
  resolution_notes?: string;
  cost_estimate?: number;
  labels?: string[];
  draft?: boolean;
  custom_fields?: Record<string, any>;
  maintenance_history?: MaintenanceRecord[];
  issue_references?: Reference[];
  status_history?: StatusHistoryRecord[];
  seen?: boolean;
  buildingName?: string;
  floorName?: string;
  roomName?: string;
  sla_hours?: number;
};

export type Step = "type" | "details" | "location" | "photos" | "review";

export type FormData = {
  title: string;
  description: string;
  type: IssueType;
  priority: string;
  status: "open" | "in_progress" | "resolved";
  assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  template_fields?: Record<string, any>;
  photos?: string[];
  fixture_id?: string;
  maintenance_priority?: "low" | "medium" | "high";
};

export type MaintenanceRecord = {
  date: string;
  type: string;
  description: string;
  performed_by: string;
  cost?: number;
};

export type Reference = {
  type: "document" | "link" | "image";
  url: string;
  title: string;
  description?: string;
};

export type StatusHistoryRecord = {
  status: "open" | "in_progress" | "resolved";
  changed_at: string;
  previous_status: "open" | "in_progress" | "resolved";
};

export type IssueTemplate = {
  id: string;
  type: IssueType;
  subcategory: string;
  title_format: string;
  problem_types: string[];
  required_fields: Record<string, {
    type: string;
    label: string;
    options?: string[];
  }>;
  optional_fields: Record<string, {
    type: string;
    label: string;
    options?: string[];
  }>;
  default_priority: string;
  icon_name: string;
  template_order: number;
  created_at: string;
  updated_at: string;
};
