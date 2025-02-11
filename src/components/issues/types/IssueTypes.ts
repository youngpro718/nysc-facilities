
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

export type FormData = {
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: string;
  assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
  type: IssueType;
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
  references?: Reference[];
};

export type Step = "type-selection" | "details" | "location" | "type" | "photos";

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
