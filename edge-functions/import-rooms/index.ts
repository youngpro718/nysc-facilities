import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportResult {
  roomId: string;
  name: string;
  status: "success" | "error";
  changes: string[];
  error?: string;
}

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

    // First verify the user and check their role
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check user has admin or cmc role for import operations
    const { data: roleData } = await authSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "cmc"])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for the actual import operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file uploaded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // Parse Excel
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames.find(name => name !== "Instructions") || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    const results: ImportResult[] = [];
    const errors: string[] = [];

    // Allowed fields whitelist for room updates
    const ALLOWED_FIELDS = new Set([
      "name", "room_number", "description", "status", "room_type",
      "current_function", "previous_functions", "function_change_date",
      "maintenance_history", "capacity", "current_occupancy",
      "is_storage", "storage_type", "storage_capacity", "storage_notes",
      "position", "size", "rotation", "phone_number",
      "last_inventory_check", "next_maintenance_date", "last_inspection_date",
      "technology_installed", "security_level", "environmental_controls",
      "is_parent", "parent_room_id", "passkey_enabled", "original_room_type",
      "temporary_storage_use", "temporary_use_timeline", "updated_at",
    ]);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const MAX_STRING_LENGTH = 1000;

    // Process each row
    for (const row of jsonData) {
      const roomId = row["Room ID"] as string;
      
      if (!roomId) {
        errors.push(`Skipping row: No Room ID found`);
        continue;
      }

      // Validate Room ID is a valid UUID
      if (!UUID_REGEX.test(roomId)) {
        errors.push(`Skipping row: Invalid Room ID format "${roomId}"`);
        continue;
      }

      const changes: string[] = [];
      const updateData: Record<string, unknown> = {};

      try {
        // Basic fields
        if (row["Name"] !== undefined) {
          updateData.name = row["Name"];
          changes.push(`name: ${row["Name"]}`);
        }
        
        if (row["Room Number"] !== undefined) {
          updateData.room_number = row["Room Number"] || null;
          changes.push(`room_number: ${row["Room Number"]}`);
        }
        
        if (row["Description"] !== undefined) {
          updateData.description = row["Description"] || null;
          changes.push(`description updated`);
        }
        
        if (row["Status"] !== undefined) {
          const status = row["Status"] as string;
          if (["active", "inactive", "under_maintenance"].includes(status)) {
            updateData.status = status;
            changes.push(`status: ${status}`);
          } else {
            errors.push(`Room ${roomId}: Invalid status "${status}"`);
          }
        }
        
        if (row["Room Type"] !== undefined) {
          updateData.room_type = row["Room Type"];
          changes.push(`room_type: ${row["Room Type"]}`);
        }
        
        if (row["Current Function"] !== undefined) {
          updateData.current_function = row["Current Function"] || null;
          changes.push(`current_function: ${row["Current Function"]}`);
        }

        // History fields (JSON parsing)
        if (row["Previous Functions (JSON)"] !== undefined) {
          try {
            const prevFuncs = row["Previous Functions (JSON)"] as string;
            if (prevFuncs) {
              const parsed = JSON.parse(prevFuncs);
              updateData.previous_functions = parsed;
              changes.push(`previous_functions updated (${parsed.length} entries)`);
            }
          } catch (e) {
            errors.push(`Room ${roomId}: Invalid Previous Functions JSON - ${e.message}`);
          }
        }
        
        if (row["Function Change Date"] !== undefined) {
          const dateStr = row["Function Change Date"] as string;
          if (dateStr) {
            updateData.function_change_date = new Date(dateStr).toISOString();
            changes.push(`function_change_date: ${dateStr}`);
          } else {
            updateData.function_change_date = null;
          }
        }
        
        if (row["Maintenance History (JSON)"] !== undefined) {
          try {
            const maintHistory = row["Maintenance History (JSON)"] as string;
            if (maintHistory) {
              const parsed = JSON.parse(maintHistory);
              updateData.maintenance_history = parsed;
              changes.push(`maintenance_history updated (${parsed.length} entries)`);
            }
          } catch (e) {
            errors.push(`Room ${roomId}: Invalid Maintenance History JSON - ${e.message}`);
          }
        }

        // Capacity & Occupancy
        if (row["Capacity"] !== undefined) {
          const cap = row["Capacity"];
          updateData.capacity = cap ? parseInt(cap as string, 10) : null;
          changes.push(`capacity: ${cap}`);
        }
        
        if (row["Current Occupancy"] !== undefined) {
          const occ = row["Current Occupancy"];
          updateData.current_occupancy = occ ? parseInt(occ as string, 10) : 0;
          changes.push(`current_occupancy: ${occ}`);
        }

        // Storage
        if (row["Is Storage"] !== undefined) {
          updateData.is_storage = (row["Is Storage"] as string).toLowerCase() === "yes";
          changes.push(`is_storage: ${updateData.is_storage}`);
        }
        
        if (row["Storage Type"] !== undefined) {
          updateData.storage_type = row["Storage Type"] || null;
          changes.push(`storage_type: ${row["Storage Type"]}`);
        }
        
        if (row["Storage Capacity"] !== undefined) {
          const cap = row["Storage Capacity"];
          updateData.storage_capacity = cap ? parseFloat(cap as string) : null;
          changes.push(`storage_capacity: ${cap}`);
        }
        
        if (row["Storage Notes"] !== undefined) {
          updateData.storage_notes = row["Storage Notes"] || null;
          changes.push(`storage_notes updated`);
        }

        // Position & Size
        if (row["Position X"] !== undefined || row["Position Y"] !== undefined) {
          updateData.position = {
            x: parseFloat(row["Position X"] as string) || 0,
            y: parseFloat(row["Position Y"] as string) || 0,
          };
          changes.push(`position updated`);
        }
        
        if (row["Width"] !== undefined || row["Height"] !== undefined) {
          updateData.size = {
            width: parseFloat(row["Width"] as string) || 150,
            height: parseFloat(row["Height"] as string) || 100,
          };
          changes.push(`size updated`);
        }
        
        if (row["Rotation"] !== undefined) {
          updateData.rotation = parseFloat(row["Rotation"] as string) || 0;
          changes.push(`rotation: ${row["Rotation"]}`);
        }

        // Contact
        if (row["Phone Number"] !== undefined) {
          updateData.phone_number = row["Phone Number"] || null;
          changes.push(`phone_number: ${row["Phone Number"]}`);
        }

        // Maintenance & Inspection
        if (row["Last Inventory Check"] !== undefined) {
          const dateStr = row["Last Inventory Check"] as string;
          updateData.last_inventory_check = dateStr ? new Date(dateStr).toISOString() : null;
          changes.push(`last_inventory_check: ${dateStr || 'null'}`);
        }
        
        if (row["Next Maintenance Date"] !== undefined) {
          const dateStr = row["Next Maintenance Date"] as string;
          updateData.next_maintenance_date = dateStr ? new Date(dateStr).toISOString() : null;
          changes.push(`next_maintenance_date: ${dateStr || 'null'}`);
        }
        
        if (row["Last Inspection Date"] !== undefined) {
          const dateStr = row["Last Inspection Date"] as string;
          updateData.last_inspection_date = dateStr || null;
          changes.push(`last_inspection_date: ${dateStr || 'null'}`);
        }

        // Technology & Security
        if (row["Technology Installed"] !== undefined) {
          const tech = row["Technology Installed"] as string;
          updateData.technology_installed = tech ? tech.split(",").map(t => t.trim()) : [];
          changes.push(`technology_installed: ${tech}`);
        }
        
        if (row["Security Level"] !== undefined) {
          updateData.security_level = row["Security Level"] || null;
          changes.push(`security_level: ${row["Security Level"]}`);
        }
        
        if (row["Environmental Controls"] !== undefined) {
          updateData.environmental_controls = row["Environmental Controls"] || null;
          changes.push(`environmental_controls updated`);
        }

        // Hierarchy & Flags
        if (row["Is Parent"] !== undefined) {
          updateData.is_parent = (row["Is Parent"] as string).toLowerCase() === "yes";
          changes.push(`is_parent: ${updateData.is_parent}`);
        }
        
        if (row["Parent Room ID"] !== undefined) {
          const parentId = row["Parent Room ID"] as string;
          if (parentId && !UUID_REGEX.test(parentId)) {
            errors.push(`Room ${roomId}: Invalid Parent Room ID format "${parentId}"`);
          } else {
            updateData.parent_room_id = parentId || null;
            changes.push(`parent_room_id: ${parentId || 'null'}`);
          }
        }
        
        if (row["Passkey Enabled"] !== undefined) {
          updateData.passkey_enabled = (row["Passkey Enabled"] as string).toLowerCase() === "yes";
          changes.push(`passkey_enabled: ${updateData.passkey_enabled}`);
        }
        
        if (row["Original Room Type"] !== undefined) {
          updateData.original_room_type = row["Original Room Type"] || null;
          changes.push(`original_room_type: ${row["Original Room Type"]}`);
        }
        
        if (row["Temporary Storage Use"] !== undefined) {
          updateData.temporary_storage_use = (row["Temporary Storage Use"] as string).toLowerCase() === "yes";
          changes.push(`temporary_storage_use: ${updateData.temporary_storage_use}`);
        }
        
        if (row["Temporary Use Timeline (JSON)"] !== undefined) {
          try {
            const timeline = row["Temporary Use Timeline (JSON)"] as string;
            if (timeline) {
              const parsed = JSON.parse(timeline);
              updateData.temporary_use_timeline = parsed;
              changes.push(`temporary_use_timeline updated`);
            }
          } catch (e) {
            errors.push(`Room ${roomId}: Invalid Temporary Use Timeline JSON - ${e.message}`);
          }
        }

        // Enforce field whitelist - strip any unauthorized fields
        for (const key of Object.keys(updateData)) {
          if (!ALLOWED_FIELDS.has(key)) {
            delete updateData[key];
            errors.push(`Room ${roomId}: Unauthorized field "${key}" removed`);
          }
        }

        // Validate string field lengths
        for (const [key, value] of Object.entries(updateData)) {
          if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
            errors.push(`Room ${roomId}: Field "${key}" exceeds max length, truncated`);
            updateData[key] = (value as string).substring(0, MAX_STRING_LENGTH);
          }
        }

        // Apply update if not dry run and has changes
        if (!dryRun && Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from("rooms")
            .update(updateData)
            .eq("id", roomId);

          if (updateError) {
            throw updateError;
          }

          // Audit log for bulk import
          await supabase.from("admin_actions_log").insert({
            admin_id: userId,
            action_type: "bulk_room_import",
            details: { room_id: roomId, changes, dry_run: dryRun },
          }).then(() => {}).catch(() => {});
        }

        results.push({
          roomId,
          name: row["Name"] as string || "Unknown",
          status: "success",
          changes,
        });

      } catch (error) {
        console.error(`Room ${roomId} import failed:`, error);
        results.push({
          roomId,
          name: row["Name"] as string || "Unknown",
          status: "error",
          changes: [],
          error: "Failed to process room. Contact administrator if issue persists.",
        });
        errors.push(`Room ${roomId}: Import failed`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        totalRows: jsonData.length,
        processed: results.length,
        successful: results.filter(r => r.status === "success").length,
        errors: results.filter(r => r.status === "error").length,
        results,
        errorMessages: errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred during import." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
