
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
  due_date?: string;  // Added this field
};

export type Step = "type-selection" | "details" | "location" | "type" | "photos";

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: string;
  created_at: string;
  assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
  room_id: string | null;
  building_id: string | null;
  floor_id: string | null;
  photos: string[] | null;
  type: IssueType;
  subcategory?: string;
  template_fields?: Record<string, any>;
  sla_hours: number;
  due_date: string | null;
  status_history: StatusHistory[] | null;
  seen: boolean;
  buildingName?: string;
  floorName?: string;
  roomName?: string;
  fixture_id?: string;
};

export type StatusHistory = {
  status: string;
  changed_at: string;
  previous_status: string;
};
