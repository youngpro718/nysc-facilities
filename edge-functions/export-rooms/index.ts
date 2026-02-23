import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // === Authentication ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all rooms with related data (RLS will scope to user's access)
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(`
        id, name, room_number, description, status, room_type,
        current_function, previous_functions, function_change_date,
        maintenance_history, floor_id,
        floors:floor_id(name, floor_number, building_id),
        capacity, current_occupancy, is_storage, storage_type,
        storage_capacity, storage_notes, phone_number, position, size,
        rotation, last_inventory_check, next_maintenance_date,
        last_inspection_date, technology_installed, security_level,
        environmental_controls, is_parent, parent_room_id,
        passkey_enabled, original_room_type, temporary_storage_use,
        temporary_use_timeline, created_at, updated_at
      `)
      .order("name");

    if (error) {
      throw error;
    }

    // Prepare data for Excel
    const exportData = rooms?.map(room => {
      const floor = room.floors as { name?: string; floor_number?: number } | null;
      
      return {
        "Room ID": room.id,
        "Name": room.name,
        "Room Number": room.room_number || "",
        "Floor": floor?.name || "",
        "Floor Number": floor?.floor_number || "",
        "Status": room.status,
        "Room Type": room.room_type,
        "Current Function": room.current_function || "",
        "Previous Functions (JSON)": JSON.stringify(room.previous_functions || []),
        "Function Change Date": room.function_change_date ? new Date(room.function_change_date).toISOString() : "",
        "Maintenance History (JSON)": JSON.stringify(room.maintenance_history || []),
        "Capacity": room.capacity || "",
        "Current Occupancy": room.current_occupancy || 0,
        "Is Storage": room.is_storage ? "Yes" : "No",
        "Storage Type": room.storage_type || "",
        "Storage Capacity": room.storage_capacity || "",
        "Storage Notes": room.storage_notes || "",
        "Position X": room.position?.x || 0,
        "Position Y": room.position?.y || 0,
        "Width": room.size?.width || 150,
        "Height": room.size?.height || 100,
        "Rotation": room.rotation || 0,
        "Phone Number": room.phone_number || "",
        "Description": room.description || "",
        "Last Inventory Check": room.last_inventory_check ? new Date(room.last_inventory_check).toISOString() : "",
        "Next Maintenance Date": room.next_maintenance_date ? new Date(room.next_maintenance_date).toISOString() : "",
        "Last Inspection Date": room.last_inspection_date || "",
        "Technology Installed": (room.technology_installed || []).join(", "),
        "Security Level": room.security_level || "",
        "Environmental Controls": room.environmental_controls || "",
        "Is Parent": room.is_parent ? "Yes" : "No",
        "Parent Room ID": room.parent_room_id || "",
        "Passkey Enabled": room.passkey_enabled ? "Yes" : "No",
        "Original Room Type": room.original_room_type || "",
        "Temporary Storage Use": room.temporary_storage_use ? "Yes" : "No",
        "Temporary Use Timeline (JSON)": JSON.stringify(room.temporary_use_timeline || {}),
        "Created At": room.created_at ? new Date(room.created_at).toISOString() : "",
        "Updated At": room.updated_at ? new Date(room.updated_at).toISOString() : "",
      };
    }) || [];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const colWidths = [
      { wch: 36 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 12 },
      { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 50 }, { wch: 25 },
      { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
      { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 40 }, { wch: 25 },
      { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
      { wch: 10 }, { wch: 36 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 50 }, { wch: 25 }, { wch: 25 },
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Rooms");
    
    // Add instructions sheet
    const instructions = [
      { "Column": "Room ID", "Description": "Unique identifier (DO NOT MODIFY)", "Editable": "No" },
      { "Column": "Name", "Description": "Room name", "Editable": "Yes" },
      { "Column": "Room Number", "Description": "Room number", "Editable": "Yes" },
      { "Column": "Floor / Floor Number", "Description": "Floor location (read-only)", "Editable": "No" },
      { "Column": "Status", "Description": "active, inactive, or under_maintenance", "Editable": "Yes" },
      { "Column": "Room Type", "Description": "Type of room", "Editable": "Yes - must be valid room_type_enum value" },
      { "Column": "Current Function", "Description": "Current actual function if different from room_type", "Editable": "Yes" },
      { "Column": "Previous Functions (JSON)", "Description": "Array of previous functions with dates", "Editable": "Yes" },
      { "Column": "Function Change Date", "Description": "ISO date string when function last changed", "Editable": "Yes" },
      { "Column": "Maintenance History (JSON)", "Description": "Array of maintenance records", "Editable": "Yes" },
      { "Column": "Last Inspection Date", "Description": "Date in YYYY-MM-DD format", "Editable": "Yes" },
      { "Column": "Description", "Description": "Room description", "Editable": "Yes" },
      { "Column": "Storage Type / Notes", "Description": "Storage details", "Editable": "Yes" },
      { "Column": "Technology Installed", "Description": "Comma-separated list of technology", "Editable": "Yes" },
      { "Column": "Security Level", "Description": "public, restricted, secure, or high_security", "Editable": "Yes" },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 35 }, { wch: 80 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rooms_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred during export." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
