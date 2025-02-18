
import { supabase } from "@/integrations/supabase/client";

export async function generateRoomReport() {
  const { data, error } = await supabase
    .from("room_health_overview")
    .select("*");

  if (error) throw error;
  return data;
}

export async function generateKeyInventoryReport() {
  const { data: stats, error } = await supabase
    .from("key_inventory_view")
    .select(`
      type,
      total_quantity,
      available_quantity,
      active_assignments,
      returned_assignments,
      lost_count
    `);

  if (error) throw error;
  return stats;
}

export async function fetchFloorplanReportData() {
  const { data, error } = await supabase
    .from("floorplan_report_data")
    .select("*");
  if (error) throw error;
  return data;
}

export async function fetchLightingReport() {
  const { data, error } = await supabase
    .from("lighting_fixture_details")
    .select("*");
  if (error) throw error;
  return data;
}

export async function fetchOccupantReport() {
  const { data, error } = await supabase
    .from("occupant_details")
    .select("*");
  if (error) throw error;
  return data;
}

export async function fetchKeyReport() {
  const { data, error } = await supabase
    .from("key_inventory_view")
    .select("*");
  if (error) throw error;
  return data;
}

export async function fetchRoomReport() {
  const { data, error } = await supabase
    .from("room_health_overview")
    .select("*");
  if (error) throw error;
  return data;
}

export async function fetchIssueReport() {
  const { data, error } = await supabase
    .from("issues")
    .select("*");
  if (error) throw error;
  return data;
}

export async function fetchFullDatabaseReport() {
  // This is a placeholder - implement based on your needs
  return {};
}

export async function generateFullReport() {
  // This is a placeholder - implement based on your needs
  return {};
}

export async function downloadReport(reportData: any, reportType: string) {
  // This is a placeholder - implement based on your needs
  console.log("Downloading report", reportType, reportData);
}
