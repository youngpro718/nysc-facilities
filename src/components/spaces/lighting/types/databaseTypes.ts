
import type { Json } from '@/integrations/supabase/types';
import { 
  LightingPosition,
  LightingTechnology,
  LightingType,
  LightStatus
} from "@/types/lighting";

export type DatabaseLightingFixture = {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  zone_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  space_id: string | null;
  space_type: string | null;
  position: LightingPosition | null;
  sequence_number: number | null;
  zone_id: string | null;
  space_name: string | null;
  room_number: string | null;
  emergency_circuit: boolean;
  technology: LightingTechnology | null;
  ballast_issue: boolean;
  bulb_count: number;
  electrical_issues: Json;
  energy_usage_data: Json;
  emergency_protocols: Json;
  warranty_info: Json;
  manufacturer_details: Json;
  inspection_history: Json;
  maintenance_history: Json;
  connected_fixtures: string[];
  maintenance_notes: string | null;
  ballast_check_notes: string | null;
  backup_power_source: string | null;
  emergency_duration_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};
