import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUp, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

interface RoomExcelImportExportProps {
  projectRef: string;
}

interface ImportResult {
  roomId: string;
  name: string;
  status: "success" | "error";
  changes: string[];
  error?: string;
}

export function RoomExcelImportExport({ projectRef }: RoomExcelImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [importResults, setImportResults] = useState<{
    totalRows: number;
    successful: number;
    errors: number;
    results: ImportResult[];
    errorMessages: string[];
  } | null>(null);

  // ── EXPORT (client-side) ──────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select(`
          id, name, room_number, description, status, room_type,
          current_function, previous_functions, function_change_date,
          maintenance_history, floor_id,
          floors:floor_id(name, floor_number),
          capacity, current_occupancy,
          is_storage, storage_type, storage_capacity, storage_notes,
          phone_number, position, size, rotation,
          last_inventory_check, next_maintenance_date, last_inspection_date,
          technology_installed, security_level, environmental_controls,
          is_parent, parent_room_id, passkey_enabled, original_room_type,
          temporary_storage_use, temporary_use_timeline,
          created_at, updated_at
        `)
        .order("name");

      if (error) throw error;
      if (!rooms || rooms.length === 0) throw new Error("No rooms found to export");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exportData = rooms.map((room: any) => {
        const floor = room.floors as { name?: string; floor_number?: number } | null;
        return {
          "Room ID": room.id,
          "Name": room.name,
          "Room Number": room.room_number || "",
          "Floor": floor?.name || "",
          "Floor Number": floor?.floor_number ?? "",
          "Status": room.status,
          "Room Type": room.room_type,
          "Current Function": room.current_function || "",
          "Previous Functions (JSON)": JSON.stringify(room.previous_functions || []),
          "Function Change Date": room.function_change_date || "",
          "Maintenance History (JSON)": JSON.stringify(room.maintenance_history || []),
          "Capacity": room.capacity ?? "",
          "Current Occupancy": room.current_occupancy ?? 0,
          "Is Storage": room.is_storage ? "Yes" : "No",
          "Storage Type": room.storage_type || "",
          "Storage Capacity": room.storage_capacity ?? "",
          "Storage Notes": room.storage_notes || "",
          "Position X": room.position?.x ?? 0,
          "Position Y": room.position?.y ?? 0,
          "Width": room.size?.width ?? 150,
          "Height": room.size?.height ?? 100,
          "Rotation": room.rotation ?? 0,
          "Phone Number": room.phone_number || "",
          "Description": room.description || "",
          "Last Inventory Check": room.last_inventory_check || "",
          "Next Maintenance Date": room.next_maintenance_date || "",
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
          "Created At": room.created_at || "",
          "Updated At": room.updated_at || "",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Rooms");

      // Instructions sheet
      const instructions = [
        { Column: "Room ID", Description: "DO NOT MODIFY", Editable: "No" },
        { Column: "Name", Description: "Room name", Editable: "Yes" },
        { Column: "Status", Description: "active / inactive / under_maintenance", Editable: "Yes" },
        { Column: "Room Type", Description: "Must be valid room_type_enum", Editable: "Yes" },
        { Column: "Current Function", Description: "Actual function if different from type", Editable: "Yes" },
        { Column: "Previous Functions (JSON)", Description: '[{"function":"office","startDate":"2023-01-01","endDate":"2024-01-01"}]', Editable: "Yes" },
        { Column: "Maintenance History (JSON)", Description: '[{"date":"2024-01-01","type":"HVAC","description":"Filter replacement","vendor":"ABC","cost":150}]', Editable: "Yes" },
      ];
      const wsInst = XLSX.utils.json_to_sheet(instructions);
      XLSX.utils.book_append_sheet(wb, wsInst, "Instructions");

      XLSX.writeFile(wb, `rooms_export_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast({ title: "Export successful", description: `${rooms.length} rooms exported to Excel.` });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export rooms",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ── IMPORT (client-side) ──────────────────────────────────────────
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const results: ImportResult[] = [];
    const errorMessages: string[] = [];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames.find(n => n !== "Instructions") || workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, unknown>[];

      for (const row of rows) {
        const roomId = row["Room ID"] as string;
        if (!roomId) { errorMessages.push("Skipping row: No Room ID"); continue; }

        const changes: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};

        try {
          // Simple fields
          if (row["Name"] !== undefined) { updateData.name = row["Name"]; changes.push(`name`); }
          if (row["Room Number"] !== undefined) { updateData.room_number = row["Room Number"] || null; changes.push(`room_number`); }
          if (row["Description"] !== undefined) { updateData.description = row["Description"] || null; changes.push(`description`); }
          if (row["Phone Number"] !== undefined) { updateData.phone_number = row["Phone Number"] || null; changes.push(`phone_number`); }
          if (row["Current Function"] !== undefined) { updateData.current_function = row["Current Function"] || null; changes.push(`current_function`); }
          if (row["Security Level"] !== undefined) { updateData.security_level = row["Security Level"] || null; changes.push(`security_level`); }
          if (row["Environmental Controls"] !== undefined) { updateData.environmental_controls = row["Environmental Controls"] || null; changes.push(`environmental_controls`); }
          if (row["Original Room Type"] !== undefined) { updateData.original_room_type = row["Original Room Type"] || null; changes.push(`original_room_type`); }

          // Status
          if (row["Status"] !== undefined) {
            const s = row["Status"] as string;
            if (["active", "inactive", "under_maintenance"].includes(s)) { updateData.status = s; changes.push(`status`); }
            else errorMessages.push(`Room ${roomId}: Invalid status "${s}"`);
          }
          if (row["Room Type"] !== undefined) { updateData.room_type = row["Room Type"]; changes.push(`room_type`); }

          // JSON fields
          const jsonFields: [string, string][] = [
            ["Previous Functions (JSON)", "previous_functions"],
            ["Maintenance History (JSON)", "maintenance_history"],
            ["Temporary Use Timeline (JSON)", "temporary_use_timeline"],
          ];
          for (const [col, field] of jsonFields) {
            if (row[col] !== undefined) {
              try {
                const val = row[col] as string;
                if (val) { updateData[field] = JSON.parse(val); changes.push(field); }
              } catch { errorMessages.push(`Room ${roomId}: Invalid JSON in "${col}"`); }
            }
          }

          // Date fields
          if (row["Function Change Date"] !== undefined) {
            const d = row["Function Change Date"] as string;
            updateData.function_change_date = d ? new Date(d).toISOString() : null;
            changes.push("function_change_date");
          }
          if (row["Last Inventory Check"] !== undefined) {
            const d = row["Last Inventory Check"] as string;
            updateData.last_inventory_check = d ? new Date(d).toISOString() : null;
            changes.push("last_inventory_check");
          }
          if (row["Next Maintenance Date"] !== undefined) {
            const d = row["Next Maintenance Date"] as string;
            updateData.next_maintenance_date = d ? new Date(d).toISOString() : null;
            changes.push("next_maintenance_date");
          }
          if (row["Last Inspection Date"] !== undefined) {
            updateData.last_inspection_date = (row["Last Inspection Date"] as string) || null;
            changes.push("last_inspection_date");
          }

          // Numeric
          if (row["Capacity"] !== undefined) { updateData.capacity = row["Capacity"] ? parseInt(String(row["Capacity"]), 10) : null; changes.push("capacity"); }
          if (row["Current Occupancy"] !== undefined) { updateData.current_occupancy = row["Current Occupancy"] ? parseInt(String(row["Current Occupancy"]), 10) : 0; changes.push("current_occupancy"); }
          if (row["Storage Capacity"] !== undefined) { updateData.storage_capacity = row["Storage Capacity"] ? parseFloat(String(row["Storage Capacity"])) : null; changes.push("storage_capacity"); }
          if (row["Rotation"] !== undefined) { updateData.rotation = parseFloat(String(row["Rotation"])) || 0; changes.push("rotation"); }

          // Boolean
          if (row["Is Storage"] !== undefined) { updateData.is_storage = String(row["Is Storage"]).toLowerCase() === "yes"; changes.push("is_storage"); }
          if (row["Is Parent"] !== undefined) { updateData.is_parent = String(row["Is Parent"]).toLowerCase() === "yes"; changes.push("is_parent"); }
          if (row["Passkey Enabled"] !== undefined) { updateData.passkey_enabled = String(row["Passkey Enabled"]).toLowerCase() === "yes"; changes.push("passkey_enabled"); }
          if (row["Temporary Storage Use"] !== undefined) { updateData.temporary_storage_use = String(row["Temporary Storage Use"]).toLowerCase() === "yes"; changes.push("temporary_storage_use"); }

          // Position & Size
          if (row["Position X"] !== undefined || row["Position Y"] !== undefined) {
            updateData.position = { x: parseFloat(String(row["Position X"])) || 0, y: parseFloat(String(row["Position Y"])) || 0 };
            changes.push("position");
          }
          if (row["Width"] !== undefined || row["Height"] !== undefined) {
            updateData.size = { width: parseFloat(String(row["Width"])) || 150, height: parseFloat(String(row["Height"])) || 100 };
            changes.push("size");
          }

          // Storage & Tech
          if (row["Storage Type"] !== undefined) { updateData.storage_type = row["Storage Type"] || null; changes.push("storage_type"); }
          if (row["Storage Notes"] !== undefined) { updateData.storage_notes = row["Storage Notes"] || null; changes.push("storage_notes"); }
          if (row["Technology Installed"] !== undefined) {
            const t = row["Technology Installed"] as string;
            updateData.technology_installed = t ? t.split(",").map(s => s.trim()) : [];
            changes.push("technology_installed");
          }
          if (row["Parent Room ID"] !== undefined) { updateData.parent_room_id = (row["Parent Room ID"] as string) || null; changes.push("parent_room_id"); }

          // Apply update
          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString();
            const { error: updateError } = await supabase.from("rooms").update(updateData).eq("id", roomId);
            if (updateError) throw updateError;
          }

          results.push({ roomId, name: (row["Name"] as string) || "Unknown", status: "success", changes });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ roomId, name: (row["Name"] as string) || "Unknown", status: "error", changes: [], error: msg });
          errorMessages.push(`Room ${roomId}: ${msg}`);
        }
      }

      const successful = results.filter(r => r.status === "success").length;
      const errors = results.filter(r => r.status === "error").length;
      setImportResults({ totalRows: rows.length, successful, errors, results, errorMessages });
      setShowResults(true);

      if (errors === 0 && successful > 0) {
        toast({ title: "Import successful", description: `${successful} rooms updated.` });
      } else if (errors > 0) {
        toast({ title: "Import completed with errors", description: `${successful} updated, ${errors} failed.`, variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  return (
    <div className="flex gap-2">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls" className="hidden" />

      <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
        {isExporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
        Export Excel
      </Button>

      <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isImporting}>
        {isImporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileUp className="h-4 w-4 mr-1.5" />}
        Import Excel
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{importResults?.errors === 0 ? "Import Successful" : "Import Results"}</DialogTitle>
            <DialogDescription>
              {`${importResults?.successful ?? 0} rooms updated, ${importResults?.errors ?? 0} errors.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {importResults?.errorMessages && importResults.errorMessages.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {importResults.errorMessages.slice(0, 5).map((msg, i) => (<li key={i}>{msg}</li>))}
                    {importResults.errorMessages.length > 5 && (<li>...and {importResults.errorMessages.length - 5} more</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-4 space-y-2">
                {importResults?.results.map((result) => (
                  <div key={result.roomId} className={`p-3 rounded-lg border ${result.status === "success" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"}`}>
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                      <span className="font-medium">{result.name}</span>
                      <span className="text-xs text-muted-foreground">({result.roomId.slice(0, 8)}...)</span>
                    </div>
                    {result.changes.length > 0 && (<div className="mt-1 text-xs text-muted-foreground">Changes: {result.changes.join(", ")}</div>)}
                    {result.error && (<div className="mt-1 text-xs text-red-600">{result.error}</div>)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
