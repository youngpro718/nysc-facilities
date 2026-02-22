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

// ── Column width helper ───────────────────────────────────────────
function autoWidth(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const cols = Object.keys(data[0]);
  ws["!cols"] = cols.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((r) => String(r[key] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
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

  // ── EXPORT ────────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select(`
          id, name, room_number, description, status, room_type,
          current_function, previous_functions, function_change_date,
          maintenance_history, persistent_issues, floor_id,
          floors:floor_id(name, floor_number, buildings:building_id(name)),
          capacity, current_occupancy,
          is_storage, storage_type, storage_capacity, storage_notes,
          phone_number,
          last_inspection_date, next_maintenance_date,
          technology_installed, security_level,
          created_at, updated_at
        `)
        .order("name");

      if (error) throw error;
      if (!rooms || rooms.length === 0) throw new Error("No rooms found to export");

      // ── Sheet 1: Room Info (clean, readable) ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roomInfoData = rooms.map((room: any) => {
        const floor = room.floors as { name?: string; floor_number?: number; buildings?: { name?: string } | null } | null;
        return {
          "Room ID": room.id,
          "Room Name": room.name || "",
          "Room Number": room.room_number || "",
          "Building": floor?.buildings?.name || "",
          "Floor": floor?.name || "",
          "Floor #": floor?.floor_number ?? "",
          "Status": room.status || "",
          "Room Type": room.room_type || "",
          "Current Function": room.current_function || "",
          "Description": room.description || "",
          "Capacity": room.capacity ?? "",
          "Occupancy": room.current_occupancy ?? 0,
          "Phone": room.phone_number || "",
          "Storage Room": room.is_storage ? "Yes" : "No",
          "Storage Type": room.storage_type || "",
          "Storage Capacity": room.storage_capacity ?? "",
          "Storage Notes": room.storage_notes || "",
          "Security Level": room.security_level || "",
          "Technology": (room.technology_installed || []).join(", "),
          "Last Inspection": room.last_inspection_date || "",
          "Next Maintenance": room.next_maintenance_date ? String(room.next_maintenance_date).split("T")[0] : "",
        };
      });

      // ── Sheet 2: Persistent Issues (one row per issue) ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const issuesData: Record<string, any>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rooms.forEach((room: any) => {
        const issues = room.persistent_issues || [];
        if (Array.isArray(issues) && issues.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          issues.forEach((issue: any) => {
            issuesData.push({
              "Room ID": room.id,
              "Room Name": room.name,
              "Room Number": room.room_number || "",
              "Category": issue.category || "",
              "Description": issue.description || "",
              "Severity": issue.severity || "",
              "Status": issue.status || "open",
              "First Reported": issue.first_reported || "",
              "Last Reported": issue.last_reported || "",
              "Notes": issue.notes || "",
            });
          });
        } else {
          issuesData.push({
            "Room ID": room.id,
            "Room Name": room.name,
            "Room Number": room.room_number || "",
            "Category": "",
            "Description": "",
            "Severity": "",
            "Status": "",
            "First Reported": "",
            "Last Reported": "",
            "Notes": "",
          });
        }
      });

      // ── Sheet 3: Maintenance Log (one row per entry) ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maintenanceData: Record<string, any>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rooms.forEach((room: any) => {
        const history = room.maintenance_history || [];
        if (Array.isArray(history) && history.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          history.forEach((entry: any) => {
            maintenanceData.push({
              "Room ID": room.id,
              "Room Name": room.name,
              "Room Number": room.room_number || "",
              "Date": entry.date || "",
              "Type": entry.type || "",
              "Description": entry.description || "",
              "Vendor / Contractor": entry.vendor || "",
              "Cost": entry.cost ?? "",
              "Notes": entry.notes || "",
            });
          });
        }
      });
      if (maintenanceData.length === 0) {
        maintenanceData.push({
          "Room ID": "(example)",
          "Room Name": "(example room)",
          "Room Number": "",
          "Date": "2024-01-15",
          "Type": "Plumbing",
          "Description": "Fixed leaking pipe under sink",
          "Vendor / Contractor": "ABC Plumbing",
          "Cost": 350,
          "Notes": "Recurring issue - 3rd time this year",
        });
      }

      // ── Sheet 4: Function History (one row per change) ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const functionData: Record<string, any>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rooms.forEach((room: any) => {
        const funcs = room.previous_functions || [];
        if (Array.isArray(funcs) && funcs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          funcs.forEach((f: any) => {
            functionData.push({
              "Room ID": room.id,
              "Room Name": room.name,
              "Room Number": room.room_number || "",
              "Function": f.function || f.name || "",
              "Start Date": f.startDate || f.start_date || "",
              "End Date": f.endDate || f.end_date || "",
              "Notes": f.notes || "",
            });
          });
        }
      });
      if (functionData.length === 0) {
        functionData.push({
          "Room ID": "(example)",
          "Room Name": "(example room)",
          "Room Number": "",
          "Function": "office",
          "Start Date": "2020-01-01",
          "End Date": "2023-06-15",
          "Notes": "Converted to conference room",
        });
      }

      // ── Build workbook ──
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(roomInfoData);
      autoWidth(ws1, roomInfoData);
      XLSX.utils.book_append_sheet(wb, ws1, "Room Info");

      const ws2 = XLSX.utils.json_to_sheet(issuesData);
      autoWidth(ws2, issuesData);
      XLSX.utils.book_append_sheet(wb, ws2, "Persistent Issues");

      const ws3 = XLSX.utils.json_to_sheet(maintenanceData);
      autoWidth(ws3, maintenanceData);
      XLSX.utils.book_append_sheet(wb, ws3, "Maintenance Log");

      const ws4 = XLSX.utils.json_to_sheet(functionData);
      autoWidth(ws4, functionData);
      XLSX.utils.book_append_sheet(wb, ws4, "Function History");

      // ── Instructions sheet ──
      const helpData = [
        { "Sheet": "Room Info", "What You Can Edit": "Name, Status, Room Type, Current Function, Description, Capacity, Phone, Storage fields, Security Level", "Notes": "Do NOT change Room ID. Status must be: active, inactive, or under_maintenance" },
        { "Sheet": "Persistent Issues", "What You Can Edit": "Add/edit rows. Category examples: Plumbing, Electrical, HVAC, Structural, Pest, Window, Door, Lighting, Mold, Noise", "Notes": "Severity: low, medium, high, critical. Status: open, monitoring, resolved" },
        { "Sheet": "Maintenance Log", "What You Can Edit": "Add new rows for maintenance work done. Fill in Room ID, Date, Type, Description", "Notes": "Cost is optional. Use the Room ID from the Room Info sheet" },
        { "Sheet": "Function History", "What You Can Edit": "Add rows to record when a room changed function. Fill in Room ID, Function, Start Date, End Date", "Notes": "Dates should be YYYY-MM-DD format" },
      ];
      const ws5 = XLSX.utils.json_to_sheet(helpData);
      autoWidth(ws5, helpData);
      XLSX.utils.book_append_sheet(wb, ws5, "How To Edit");

      XLSX.writeFile(wb, `rooms_export_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast({ title: "Export successful", description: `${rooms.length} rooms exported across 4 sheets.` });
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

  // ── IMPORT ────────────────────────────────────────────────────────
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const results: ImportResult[] = [];
    const errorMessages: string[] = [];
    const updatedRoomIds = new Set<string>();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // ── Process "Room Info" sheet ──
      const roomInfoSheet = workbook.Sheets["Room Info"];
      if (roomInfoSheet) {
        const rows = XLSX.utils.sheet_to_json(roomInfoSheet) as Record<string, unknown>[];
        for (const row of rows) {
          const roomId = row["Room ID"] as string;
          if (!roomId || roomId === "(example)") continue;

          const changes: string[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateData: Record<string, any> = {};

          try {
            if (row["Room Name"] !== undefined) { updateData.name = row["Room Name"]; changes.push("name"); }
            if (row["Room Number"] !== undefined) { updateData.room_number = row["Room Number"] || null; changes.push("room_number"); }
            if (row["Description"] !== undefined) { updateData.description = row["Description"] || null; changes.push("description"); }
            if (row["Phone"] !== undefined) { updateData.phone_number = row["Phone"] || null; changes.push("phone"); }
            if (row["Current Function"] !== undefined) { updateData.current_function = row["Current Function"] || null; changes.push("current_function"); }
            if (row["Security Level"] !== undefined) { updateData.security_level = row["Security Level"] || null; changes.push("security_level"); }

            if (row["Status"] !== undefined) {
              const s = String(row["Status"]).toLowerCase();
              if (["active", "inactive", "under_maintenance"].includes(s)) { updateData.status = s; changes.push("status"); }
              else errorMessages.push(`Room ${roomId}: Invalid status "${row["Status"]}"`);
            }
            if (row["Room Type"] !== undefined) { updateData.room_type = row["Room Type"]; changes.push("room_type"); }
            if (row["Capacity"] !== undefined && row["Capacity"] !== "") { updateData.capacity = parseInt(String(row["Capacity"]), 10) || null; changes.push("capacity"); }
            if (row["Occupancy"] !== undefined) { updateData.current_occupancy = parseInt(String(row["Occupancy"]), 10) || 0; changes.push("occupancy"); }
            if (row["Storage Room"] !== undefined) { updateData.is_storage = String(row["Storage Room"]).toLowerCase() === "yes"; changes.push("is_storage"); }
            if (row["Storage Type"] !== undefined) { updateData.storage_type = row["Storage Type"] || null; changes.push("storage_type"); }
            if (row["Storage Capacity"] !== undefined && row["Storage Capacity"] !== "") { updateData.storage_capacity = parseFloat(String(row["Storage Capacity"])) || null; changes.push("storage_capacity"); }
            if (row["Storage Notes"] !== undefined) { updateData.storage_notes = row["Storage Notes"] || null; changes.push("storage_notes"); }
            if (row["Technology"] !== undefined) {
              const t = String(row["Technology"]);
              updateData.technology_installed = t ? t.split(",").map(s => s.trim()).filter(Boolean) : [];
              changes.push("technology");
            }

            if (Object.keys(updateData).length > 0) {
              updateData.updated_at = new Date().toISOString();
              const { error: updateError } = await supabase.from("rooms").update(updateData).eq("id", roomId);
              if (updateError) throw updateError;
              updatedRoomIds.add(roomId);
            }

            results.push({ roomId, name: String(row["Room Name"] || "Unknown"), status: "success", changes });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            results.push({ roomId, name: String(row["Room Name"] || "Unknown"), status: "error", changes: [], error: msg });
            errorMessages.push(`Room ${roomId}: ${msg}`);
          }
        }
      }

      // ── Process "Persistent Issues" sheet ──
      const issuesSheet = workbook.Sheets["Persistent Issues"];
      if (issuesSheet) {
        const rows = XLSX.utils.sheet_to_json(issuesSheet) as Record<string, unknown>[];
        // Group issues by room ID
        const issuesByRoom = new Map<string, Record<string, unknown>[]>();
        for (const row of rows) {
          const roomId = row["Room ID"] as string;
          if (!roomId || roomId === "(example)") continue;
          if (!row["Category"] && !row["Description"]) continue;
          if (!issuesByRoom.has(roomId)) issuesByRoom.set(roomId, []);
          issuesByRoom.get(roomId)!.push({
            category: row["Category"] || "",
            description: row["Description"] || "",
            severity: row["Severity"] || "medium",
            status: row["Status"] || "open",
            first_reported: row["First Reported"] || "",
            last_reported: row["Last Reported"] || "",
            notes: row["Notes"] || "",
          });
        }

        for (const [roomId, issues] of issuesByRoom) {
          try {
            const { error: updateError } = await supabase
              .from("rooms")
              .update({ persistent_issues: issues, updated_at: new Date().toISOString() })
              .eq("id", roomId);
            if (updateError) throw updateError;

            if (!updatedRoomIds.has(roomId)) {
              results.push({ roomId, name: roomId.slice(0, 8), status: "success", changes: [`${issues.length} issues`] });
              updatedRoomIds.add(roomId);
            } else {
              const existing = results.find(r => r.roomId === roomId);
              if (existing) existing.changes.push(`${issues.length} issues`);
            }
          } catch (err) {
            errorMessages.push(`Issues for ${roomId}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // ── Process "Maintenance Log" sheet ──
      const maintSheet = workbook.Sheets["Maintenance Log"];
      if (maintSheet) {
        const rows = XLSX.utils.sheet_to_json(maintSheet) as Record<string, unknown>[];
        const maintByRoom = new Map<string, Record<string, unknown>[]>();
        for (const row of rows) {
          const roomId = row["Room ID"] as string;
          if (!roomId || roomId === "(example)") continue;
          if (!row["Date"] && !row["Description"]) continue;
          if (!maintByRoom.has(roomId)) maintByRoom.set(roomId, []);
          maintByRoom.get(roomId)!.push({
            date: row["Date"] || "",
            type: row["Type"] || "",
            description: row["Description"] || "",
            vendor: row["Vendor / Contractor"] || "",
            cost: row["Cost"] ? parseFloat(String(row["Cost"])) : null,
            notes: row["Notes"] || "",
          });
        }

        for (const [roomId, entries] of maintByRoom) {
          try {
            const { error: updateError } = await supabase
              .from("rooms")
              .update({ maintenance_history: entries, updated_at: new Date().toISOString() })
              .eq("id", roomId);
            if (updateError) throw updateError;

            if (!updatedRoomIds.has(roomId)) {
              results.push({ roomId, name: roomId.slice(0, 8), status: "success", changes: [`${entries.length} maintenance entries`] });
              updatedRoomIds.add(roomId);
            } else {
              const existing = results.find(r => r.roomId === roomId);
              if (existing) existing.changes.push(`${entries.length} maintenance entries`);
            }
          } catch (err) {
            errorMessages.push(`Maintenance for ${roomId}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // ── Process "Function History" sheet ──
      const funcSheet = workbook.Sheets["Function History"];
      if (funcSheet) {
        const rows = XLSX.utils.sheet_to_json(funcSheet) as Record<string, unknown>[];
        const funcByRoom = new Map<string, Record<string, unknown>[]>();
        for (const row of rows) {
          const roomId = row["Room ID"] as string;
          if (!roomId || roomId === "(example)") continue;
          if (!row["Function"]) continue;
          if (!funcByRoom.has(roomId)) funcByRoom.set(roomId, []);
          funcByRoom.get(roomId)!.push({
            function: row["Function"] || "",
            startDate: row["Start Date"] || "",
            endDate: row["End Date"] || "",
            notes: row["Notes"] || "",
          });
        }

        for (const [roomId, entries] of funcByRoom) {
          try {
            const { error: updateError } = await supabase
              .from("rooms")
              .update({ previous_functions: entries, updated_at: new Date().toISOString() })
              .eq("id", roomId);
            if (updateError) throw updateError;

            if (!updatedRoomIds.has(roomId)) {
              results.push({ roomId, name: roomId.slice(0, 8), status: "success", changes: [`${entries.length} function history entries`] });
              updatedRoomIds.add(roomId);
            } else {
              const existing = results.find(r => r.roomId === roomId);
              if (existing) existing.changes.push(`${entries.length} function history entries`);
            }
          } catch (err) {
            errorMessages.push(`Function history for ${roomId}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      const successful = results.filter(r => r.status === "success").length;
      const errCount = results.filter(r => r.status === "error").length;
      setImportResults({ totalRows: results.length, successful, errors: errCount, results, errorMessages });
      setShowResults(true);

      if (errCount === 0 && successful > 0) {
        toast({ title: "Import successful", description: `${successful} rooms updated.` });
      } else if (errCount > 0) {
        toast({ title: "Import completed with errors", description: `${successful} updated, ${errCount} failed.`, variant: "destructive" });
      } else {
        toast({ title: "No changes", description: "No data to import was found in the file." });
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
