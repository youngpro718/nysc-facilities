export type LightingTemplateType = 'main_hallway' | 'elevator_bank' | 'special_floor';

export interface LightingTemplate {
  id: string;
  name: string;
  template_type: LightingTemplateType;
  fixture_count: number;
  bulbs_per_fixture: number;
  floor_restrictions?: number[] | null;
  special_config: {
    sequence_start?: number;
    naming_pattern?: string;
    floor?: number;
    location?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface FloorLightingMetadata {
  id: string;
  floor_id: string;
  elevator_bank_count: number;
  has_special_north_config: boolean;
  special_config_details: {
    north_fixture_count?: number;
    special_zones?: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface HallwayConnection {
  id: string;
  main_hallway_id: string;
  connected_hallway_id: string;
  connection_point: {
    position: string;
    access_type: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface LightingBulkOperation {
  hallway_id: string;
  operation_type: 'create' | 'update' | 'delete' | 'maintenance';
  template_id?: string;
  fixtures_affected: string[];
  status_change?: string;
  maintenance_notes?: string;
}