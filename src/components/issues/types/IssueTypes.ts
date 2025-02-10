
export type IssueType = 
  | "HVAC" 
  | "Leak" 
  | "Electrical" 
  | "Plaster" 
  | "Cleaning" 
  | "Other" 
  | "Lighting_Ballast" 
  | "Lighting_Replacement" 
  | "Lighting_Emergency" 
  | "Lighting_Sensor"
  | "Lighting_Control";

export type FormData = {
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: string;
  assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
  type: IssueType;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  photos?: string[];
  fixture_id?: string;
  // Extended fields for context-aware forms
  temperature?: number;
  occupancy_status?: "occupied" | "vacant";
  maintenance_history?: string;
  safety_assessment?: string;
  damage_assessment?: string;
  area_size?: string;
  urgency_reason?: string;
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
