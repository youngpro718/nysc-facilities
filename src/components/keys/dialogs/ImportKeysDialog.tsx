import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImportKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

// Minimal CSV parser handling quoted fields and commas within quotes
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    // Unescape double quotes inside quoted fields
    current.push(inQuotes ? cell.replace(/""/g, '"') : cell);
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { // escaped quote
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        pushCell();
      } else if (ch === '\n') {
        pushCell();
        rows.push(current);
        current = [];
      } else if (ch === '\r') {
        // ignore CR
      } else {
        cell += ch;
      }
    }
  }
  // flush last cell/row
  pushCell();
  if (current.length) rows.push(current);
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

type ImportRow = {
  name: string;
  type?: string;
  total_quantity?: number;
  available_quantity?: number;
  is_passkey?: boolean;
  key_scope?: string | null;
  status?: string | null;
  _raw?: Record<string, string>;
  _error?: string;
};

export function ImportKeysDialog({ open, onOpenChange, onImported }: ImportKeysDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const hasErrors = useMemo(() => rows.some(r => r._error), [rows]);

  const handleTemplate = () => {
    const headers = ["name","type","total_quantity","available_quantity","is_passkey","key_scope","status"];
    const example = [
      ["Master Pass","pass","10","10","true","All Courts","active"],
      ["Front Door","physical","25","25","false","Building A","active"],
    ];
    const csv = [headers.join(','), ...example.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keys_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleParse = async () => {
    if (!file) return;
    setIsParsing(true);
    try {
      const text = await file.text();
      const matrix = parseCsv(text);
      if (matrix.length === 0) {
        setRows([]);
        toast.error("CSV appears empty");
        return;
      }
      const headers = matrix[0].map(h => h.trim().toLowerCase());
      const out: ImportRow[] = [];
      for (let i = 1; i < matrix.length; i++) {
        const row = matrix[i];
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => { obj[h] = (row[idx] ?? '').trim(); });
        const rec: ImportRow = {
          name: obj["name"] || "",
          type: obj["type"] || undefined,
          total_quantity: obj["total_quantity"] ? Number(obj["total_quantity"]) : undefined,
          available_quantity: obj["available_quantity"] ? Number(obj["available_quantity"]) : undefined,
          is_passkey: obj["is_passkey"] ? /^true|1|yes$/i.test(obj["is_passkey"]) : undefined,
          key_scope: obj["key_scope"] || null,
          status: obj["status"] || null,
          _raw: obj,
        };
        if (!rec.name) rec._error = "Missing name";
        if (Number.isNaN(rec.total_quantity as any)) rec._error = (rec._error ? rec._error+"; " : "")+"Invalid total_quantity";
        if (Number.isNaN(rec.available_quantity as any)) rec._error = (rec._error ? rec._error+"; " : "")+"Invalid available_quantity";
        out.push(rec);
      }
      setRows(out);
      if (out.length) toast.success(`Parsed ${out.length} rows`);
    } catch (e:any) {
      console.error(e);
      toast.error("Failed to parse CSV");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setIsImporting(true);
    let success = 0; let failed = 0;
    try {
      for (const r of rows) {
        if (r._error) { failed++; continue; }
        // Upsert by name (select existing)
        const { data: existing, error: selErr } = await supabase
          .from('keys')
          .select('id')
          .eq('name', r.name)
          .maybeSingle();
        if (selErr) { failed++; continue; }

        const payload: any = {
          name: r.name,
          type: r.type ?? 'physical',
          total_quantity: r.total_quantity ?? 0,
          available_quantity: r.available_quantity ?? r.total_quantity ?? 0,
          is_passkey: !!r.is_passkey,
          key_scope: r.key_scope,
          status: r.status ?? 'active',
        };

        if (existing?.id) {
          const { error: updErr } = await supabase
            .from('keys')
            .update(payload)
            .eq('id', existing.id);
          if (updErr) { failed++; continue; }
        } else {
          const { error: insErr } = await supabase
            .from('keys')
            .insert(payload);
          if (insErr) { failed++; continue; }
        }
        success++;
      }
      toast.success(`Imported ${success} row(s). ${failed ? failed+" failed." : ""}`);
      onImported?.();
      onOpenChange(false);
      setRows([]);
      setFile(null);
    } catch (e:any) {
      console.error(e);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalFrame
        title="Import Keys"
        description="Upload a CSV to create or update keys."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="file">CSV File</Label>
              <Input id="file" type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground">Required columns: name. Optional: type, total_quantity, available_quantity, is_passkey, key_scope, status.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTemplate}>Download Template</Button>
              <Button variant="outline" onClick={handleParse} disabled={!file || isParsing}>{isParsing? 'Parsing...' : 'Parse'}</Button>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline">Rows: {rows.length}</Badge>
              {hasErrors ? <Badge variant="destructive">Has errors</Badge> : <Badge variant="secondary">Ready</Badge>}
            </div>
            {rows.length > 0 && (
              <div className="mt-3 max-h-64 overflow-auto text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Available</th>
                      <th className="p-2">Pass?</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.type || ''}</td>
                        <td className="p-2">{r.total_quantity ?? ''}</td>
                        <td className="p-2">{r.available_quantity ?? ''}</td>
                        <td className="p-2">{r.is_passkey ? 'yes' : ''}</td>
                        <td className="p-2">{r.status || ''}</td>
                        <td className="p-2 text-destructive">{r._error || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <div className="text-xs text-muted-foreground mt-2">Showing first 50 rows…</div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!rows.length || hasErrors || isImporting}>
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      </ModalFrame>
    </Dialog>
  );
}
