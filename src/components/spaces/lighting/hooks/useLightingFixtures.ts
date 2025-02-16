
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLightingFixture } from "../types/databaseTypes";
import { parseJsonField } from "../utils/jsonUtils";
import { 
  LightingFixture,
  ElectricalIssues,
  EnergyUsageData,
  EmergencyProtocols,
  WarrantyInfo,
  ManufacturerDetails,
  InspectionEntry,
  MaintenanceEntry
} from "@/components/lighting/types";

interface UseLightingFixturesProps {
  selectedBuilding: string;
  selectedFloor: string;
}

function transformDatabaseFixture(raw: DatabaseLightingFixture): LightingFixture {
  // Helper function to validate space type
  const validateSpaceType = (type: string | null): "room" | "hallway" | null => {
    if (type === "room" || type === "hallway") {
      return type;
    }
    return null;
  };

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    status: raw.status,
    zone_name: raw.zone_name,
    building_name: raw.building_name,
    floor_name: raw.floor_name,
    floor_id: raw.floor_id,
    space_id: raw.space_id,
    space_type: validateSpaceType(raw.space_type),
    position: raw.position,
    sequence_number: raw.sequence_number,
    zone_id: raw.zone_id,
    space_name: raw.space_name,
    room_number: raw.room_number,
    emergency_circuit: raw.emergency_circuit ?? false,
    technology: raw.technology,
    ballast_issue: raw.ballast_issue ?? false,
    bulb_count: raw.bulb_count ?? 1,
    electrical_issues: parseJsonField<ElectricalIssues>(raw.electrical_issues, {
      short_circuit: false,
      wiring_issues: false,
      voltage_problems: false
    }),
    energy_usage_data: parseJsonField<EnergyUsageData>(raw.energy_usage_data, {
      daily_usage: [],
      efficiency_rating: null,
      last_reading: null
    }),
    emergency_protocols: parseJsonField<EmergencyProtocols>(raw.emergency_protocols, {
      emergency_contact: null,
      backup_system: false,
      evacuation_route: false
    }),
    warranty_info: parseJsonField<WarrantyInfo>(raw.warranty_info, {
      start_date: null,
      end_date: null,
      provider: null,
      terms: null
    }),
    manufacturer_details: parseJsonField<ManufacturerDetails>(raw.manufacturer_details, {
      name: null,
      model: null,
      serial_number: null,
      support_contact: null
    }),
    inspection_history: parseJsonField<InspectionEntry[]>(raw.inspection_history, []),
    maintenance_history: parseJsonField<MaintenanceEntry[]>(raw.maintenance_history, []),
    connected_fixtures: raw.connected_fixtures || [],
    maintenance_notes: raw.maintenance_notes,
    ballast_check_notes: raw.ballast_check_notes,
    backup_power_source: raw.backup_power_source,
    emergency_duration_minutes: raw.emergency_duration_minutes,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}

async function fetchLightingFixtures(selectedBuilding: string, selectedFloor: string) {
  let query = supabase
    .from('lighting_fixture_details')
    .select('*')
    .order('name');

  if (selectedFloor !== 'all') {
    query = query.eq('floor_id', selectedFloor);
  }
  if (selectedBuilding !== 'all') {
    query = query.eq('building_id', selectedBuilding);
  }

  const { data: rawData, error } = await query;
  if (error) throw error;
  if (!rawData) return [];

  return (rawData as DatabaseLightingFixture[]).map(transformDatabaseFixture);
}

export function useLightingFixtures({ selectedBuilding, selectedFloor }: UseLightingFixturesProps) {
  return useQuery({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor],
    queryFn: () => fetchLightingFixtures(selectedBuilding, selectedFloor)
  });
}
