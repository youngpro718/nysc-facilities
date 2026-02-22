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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all rooms with related data
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(`
        id,
        name,
        room_number,
        description,
        status,
        room_type,
        current_function,
        previous_functions,
        function_change_date,
        maintenance_history,
        floor_id,
        floors:floor_id(name, floor_number, building_id),
        capacity,
        current_occupancy,
        is_storage,
        storage_type,
        storage_capacity,
        storage_notes,
        phone_number,
        position,
        size,
        rotation,
        last_inventory_check,
        next_maintenance_date,
        last_inspection_date,
        technology_installed,
        security_level,
        environmental_controls,
        is_parent,
        parent_room_id,
        passkey_enabled,
        original_room_type,
        temporary_storage_use,
        temporary_use_timeline,
        created_at,
        updated_at
      `)
      .order("name");

    if (error) {
      throw error;
    }

    // Prepare data for Excel
    const exportData = rooms?.map(room => {
      const floor = room.floors as { name?: string; floor_number?: number } | null;
      
      return {
        // Identification
        "Room ID": room.id,
        "Name": room.name,
        "Room Number": room.room_number || "",
        "Floor": floor?.name || "",
        "Floor Number": floor?.floor_number || "",
        
        // Status & Type
        "Status": room.status,
        "Room Type": room.room_type,
        "Current Function": room.current_function || "",
        
        // History (editable)
        "Previous Functions (JSON)": JSON.stringify(room.previous_functions || []),
        "Function Change Date": room.function_change_date ? new Date(room.function_change_date).toISOString() : "",
        "Maintenance History (JSON)": JSON.stringify(room.maintenance_history || []),
        
        // Capacity & Occupancy
        "Capacity": room.capacity || "",
        "Current Occupancy": room.current_occupancy || 0,
        
        // Storage
        "Is Storage": room.is_storage ? "Yes" : "No",
        "Storage Type": room.storage_type || "",
        "Storage Capacity": room.storage_capacity || "",
        "Storage Notes": room.storage_notes || "",
        
        // Position & Size
        "Position X": room.position?.x || 0,
        "Position Y": room.position?.y || 0,
        "Width": room.size?.width || 150,
        "Height": room.size?.height || 100,
        "Rotation": room.rotation || 0,
        
        // Contact & Details
        "Phone Number": room.phone_number || "",
        "Description": room.description || "",
        
        // Maintenance & Inspection
        "Last Inventory Check": room.last_inventory_check ? new Date(room.last_inventory_check).toISOString() : "",
        "Next Maintenance Date": room.next_maintenance_date ? new Date(room.next_maintenance_date).toISOString() : "",
        "Last Inspection Date": room.last_inspection_date || "",
        
        // Technology & Security
        "Technology Installed": (room.technology_installed || []).join(", "),
        "Security Level": room.security_level || "",
        "Environmental Controls": room.environmental_controls || "",
        
        // Hierarchy
        "Is Parent": room.is_parent ? "Yes" : "No",
        "Parent Room ID": room.parent_room_id || "",
        "Passkey Enabled": room.passkey_enabled ? "Yes" : "No",
        "Original Room Type": room.original_room_type || "",
        "Temporary Storage Use": room.temporary_storage_use ? "Yes" : "No",
        "Temporary Use Timeline (JSON)": JSON.stringify(room.temporary_use_timeline || {}),
        
        // System
        "Created At": room.created_at ? new Date(room.created_at).toISOString() : "",
        "Updated At": room.updated_at ? new Date(room.updated_at).toISOString() : "",
      };
    }) || [];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const colWidths = [
      { wch: 36 }, // Room ID
      { wch: 30 }, // Name
      { wch: 15 }, // Room Number
      { wch: 20 }, // Floor
      { wch: 12 }, // Floor Number
      { wch: 15 }, // Status
      { wch: 20 }, // Room Type
      { wch: 25 }, // Current Function
      { wch: 50 }, // Previous Functions
      { wch: 25 }, // Function Change Date
      { wch: 50 }, // Maintenance History
      { wch: 10 }, // Capacity
      { wch: 15 }, // Current Occupancy
      { wch: 10 }, // Is Storage
      { wch: 15 }, // Storage Type
      { wch: 15 }, // Storage Capacity
      { wch: 30 }, // Storage Notes
      { wch: 12 }, // Position X
      { wch: 12 }, // Position Y
      { wch: 10 }, // Width
      { wch: 10 }, // Height
      { wch: 10 }, // Rotation
      { wch: 15 }, // Phone Number
      { wch: 40 }, // Description
      { wch: 25 }, // Last Inventory Check
      { wch: 25 }, // Next Maintenance Date
      { wch: 15 }, // Last Inspection Date
      { wch: 30 }, // Technology Installed
      { wch: 15 }, // Security Level
      { wch: 20 }, // Environmental Controls
      { wch: 10 }, // Is Parent
      { wch: 36 }, // Parent Room ID
      { wch: 15 }, // Passkey Enabled
      { wch: 20 }, // Original Room Type
      { wch: 15 }, // Temporary Storage Use
      { wch: 50 }, // Temporary Use Timeline
      { wch: 25 }, // Created At
      { wch: 25 }, // Updated At
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
      { "Column": "Previous Functions (JSON)", "Description": "Array of previous functions with dates. Format: [{\"function\":\"office\",\"startDate\":\"2023-01-01\",\"endDate\":\"2024-01-01\"}]", "Editable": "Yes" },
      { "Column": "Function Change Date", "Description": "ISO date string when function last changed", "Editable": "Yes" },
      { "Column": "Maintenance History (JSON)", "Description": "Array of maintenance records. Format: [{\"date\":\"2024-01-01\",\"type\":\"HVAC\",\"description\":\"Filter replacement\",\"vendor\":\"ABC Co\",\"cost\":150}]", "Editable": "Yes" },
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
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
