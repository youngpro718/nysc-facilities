
import { 
  LightingPosition,
  LightingTechnology,
  LightingType,
  LightStatus,
  ElectricalIssues,
  EnergyUsageData,
  EmergencyProtocols,
  WarrantyInfo,
  ManufacturerDetails,
  InspectionEntry,
  MaintenanceEntry,
  LightingCoordinates
} from "@/components/lighting/types";

export type DatabaseLightingFixture = {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  zone_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  building_id: string | null;
  space_id: string | null;
  space_type: 'room' | 'hallway' | null;
  position: LightingPosition | null;
  coordinates: LightingCoordinates | null;
  sequence_number: number | null;
  zone_id: string | null;
  space_name: string | null;
  room_number: string | null;
  emergency_circuit: boolean;
  technology: LightingTechnology | null;
  ballast_issue: boolean;
  bulb_count: number;
  electrical_issues: ElectricalIssues;
  energy_usage_data: EnergyUsageData;
  emergency_protocols: EmergencyProtocols;
  warranty_info: WarrantyInfo;
  manufacturer_details: ManufacturerDetails;
  inspection_history: InspectionEntry[];
  maintenance_history: MaintenanceEntry[];
  connected_fixtures: string[];
  maintenance_notes: string | null;
  ballast_check_notes: string | null;
  backup_power_source: string | null;
  emergency_duration_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export function mapDatabaseFixtureToLightingFixture(dbFixture: any): DatabaseLightingFixture {
  return {
    ...dbFixture,
    space_type: dbFixture.space_type === 'room' || dbFixture.space_type === 'hallway' 
      ? dbFixture.space_type 
      : null,
    coordinates: dbFixture.coordinates || null,
    electrical_issues: {
      short_circuit: dbFixture.electrical_issues?.short_circuit ?? false,
      wiring_issues: dbFixture.electrical_issues?.wiring_issues ?? false,
      voltage_problems: dbFixture.electrical_issues?.voltage_problems ?? false
    },
    energy_usage_data: dbFixture.energy_usage_data || {
      daily_usage: [],
      efficiency_rating: null,
      last_reading: null
    },
    emergency_protocols: dbFixture.emergency_protocols || {
      emergency_contact: null,
      backup_system: false,
      evacuation_route: false
    },
    warranty_info: dbFixture.warranty_info || {
      start_date: null,
      end_date: null,
      provider: null,
      terms: null
    },
    manufacturer_details: dbFixture.manufacturer_details || {
      name: null,
      model: null,
      serial_number: null,
      support_contact: null
    },
    inspection_history: Array.isArray(dbFixture.inspection_history) ? dbFixture.inspection_history : [],
    maintenance_history: Array.isArray(dbFixture.maintenance_history) ? dbFixture.maintenance_history : [],
    connected_fixtures: Array.isArray(dbFixture.connected_fixtures) ? dbFixture.connected_fixtures : []
  };
}
