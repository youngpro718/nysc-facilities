// Admin → Printers
// Manage the room ↔ printer ↔ toner mapping that drives the toner suggestion
// panel in the supply order cart. Every printer row can be edited, moved to
// another room, or unassigned. Toner selection is a dropdown of real Toner
// inventory items (stored in Room 1726) so a room's toner code always
// resolves to an orderable SKU.
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Printer, Plus, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '@shared/hooks/use-toast';

interface PrinterRow {
  id: string;
  room_id: string | null;
  printer_model: string | null;
  toner_code: string | null;
  needs_review: boolean;
  review_reason: string | null;
  inventory_item_id: string | null;
  room?: { id: string; name: string; room_number: string | null } | null;
  toner_item?: { id: string; name: string; sku: string | null } | null;
}

interface TonerItem {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
}

interface RoomOption {
  id: string;
  name: string;
  room_number: string | null;
}

export default function AdminPrinters() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PrinterRow | null>(null);
  const [creating, setCreating] = useState(false);

  const printersQuery = useQuery({
    queryKey: ['admin-printers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_printers')
        .select(
          `id, room_id, printer_model, toner_code, needs_review, review_reason, inventory_item_id,
           room:rooms!room_printers_room_id_fkey (id, name, room_number),
           toner_item:inventory_items!room_printers_inventory_item_id_fkey (id, name, sku)`,
        )
        .order('toner_code', { ascending: true });
      if (error) throw error;
      return (data as unknown as PrinterRow[]) ?? [];
    },
  });

  const tonerQuery = useQuery({
    queryKey: ['toner-inventory-items'],
    queryFn: async () => {
      const { data: cat } = await supabase
        .from('inventory_categories')
        .select('id')
        .eq('name', 'Toner / Printer Supplies')
        .maybeSingle();
      if (!cat) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, sku, quantity')
        .eq('category_id', cat.id)
        .order('name');
      if (error) throw error;
      return (data as TonerItem[]) ?? [];
    },
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_number')
        .order('room_number', { ascending: true, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return (data as RoomOption[]) ?? [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (row: Partial<PrinterRow> & { id?: string }) => {
      const payload = {
        room_id: row.room_id ?? null,
        printer_model: row.printer_model ?? null,
        toner_code: row.toner_code ?? null,
        inventory_item_id: row.inventory_item_id ?? null,
        needs_review: row.needs_review ?? false,
        review_reason: row.review_reason ?? null,
      };
      if (row.id) {
        const { error } = await supabase
          .from('room_printers')
          .update(payload)
          .eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('room_printers').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-printers'] });
      qc.invalidateQueries({ queryKey: ['room-printers'] });
      toast({ title: 'Printer saved' });
      setEditing(null);
      setCreating(false);
    },
    onError: (e: any) => {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('room_printers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-printers'] });
      qc.invalidateQueries({ queryKey: ['room-printers'] });
      toast({ title: 'Printer removed' });
      setEditing(null);
    },
    onError: (e: any) => {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    },
  });

  const rows = printersQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const roomLabel = `${r.room?.room_number ?? ''} ${r.room?.name ?? ''}`.toLowerCase();
      return (
        roomLabel.includes(q) ||
        (r.printer_model ?? '').toLowerCase().includes(q) ||
        (r.toner_code ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const unlinkedCount = rows.filter((r) => r.toner_code && !r.inventory_item_id).length;

  return (
    <PageContainer>
      <PageHeader
        title="Printers & Toners"
        description="Manage which printer lives in which room, and which toner cartridge it uses. Toner cartridges are stored in Room 1726 and can be ordered like any other supply."
        icon={Printer}
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room, model, or toner code…"
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add printer
        </Button>
      </div>

      {unlinkedCount > 0 && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {unlinkedCount} printer{unlinkedCount === 1 ? '' : 's'} still need a toner
            item linked so users can order the cartridge directly.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {printersQuery.isLoading ? (
            <div className="p-8 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading printers…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Printer model</TableHead>
                  <TableHead>Toner code</TableHead>
                  <TableHead>Linked inventory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.room?.room_number || r.room?.name || (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>{r.printer_model || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{r.toner_code || '—'}</TableCell>
                    <TableCell>
                      {r.toner_item ? (
                        <span className="text-sm">{r.toner_item.name}</span>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Not linked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.needs_review ? (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">
                          Needs review
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No printers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PrinterEditor
        open={!!editing || creating}
        printer={editing}
        rooms={roomsQuery.data ?? []}
        toners={tonerQuery.data ?? []}
        onCancel={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={(p) => upsertMutation.mutate(p)}
        onDelete={editing ? () => deleteMutation.mutate(editing.id) : undefined}
        saving={upsertMutation.isPending}
        deleting={deleteMutation.isPending}
      />
    </PageContainer>
  );
}

function PrinterEditor({
  open,
  printer,
  rooms,
  toners,
  onCancel,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  open: boolean;
  printer: PrinterRow | null;
  rooms: RoomOption[];
  toners: TonerItem[];
  onCancel: () => void;
  onSave: (p: Partial<PrinterRow> & { id?: string }) => void;
  onDelete?: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [tonerItemId, setTonerItemId] = useState<string | null>(null);
  const [needsReview, setNeedsReview] = useState(false);

  useEffect(() => {
    if (open) {
      setRoomId(printer?.room_id ?? null);
      setModel(printer?.printer_model ?? '');
      setTonerItemId(printer?.inventory_item_id ?? null);
      setNeedsReview(printer?.needs_review ?? false);
    }
  }, [open, printer]);

  const selectedToner = toners.find((t) => t.id === tonerItemId) ?? null;
  // Derive the display code from the linked toner item name ("Toner 26A" → "26A")
  const derivedCode = selectedToner
    ? selectedToner.name.replace(/^toner\s+/i, '').trim()
    : printer?.toner_code ?? null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{printer ? 'Edit printer' : 'Add printer'}</DialogTitle>
          <DialogDescription>
            Set which room the printer lives in and which toner cartridge it uses.
            Ordering that toner uses the linked inventory item stored in Room 1726.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Room</Label>
            <Select value={roomId ?? ''} onValueChange={(v) => setRoomId(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a room" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.room_number ? `${r.room_number} — ` : ''}{r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Printer model</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. HP LaserJet Pro M404"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Toner cartridge</Label>
            <Select
              value={tonerItemId ?? ''}
              onValueChange={(v) => setTonerItemId(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a toner from inventory" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {toners.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.sku ? `(${t.sku})` : ''} — {t.quantity} in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedToner && (
              <p className="text-[11px] text-muted-foreground">
                Users ordering for this room will see "{selectedToner.name}" as a one-tap add.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={needsReview}
              onChange={(e) => setNeedsReview(e.target.checked)}
              className="h-4 w-4"
            />
            Flag for review
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
              type="button"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Remove printer
            </Button>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button
              onClick={() =>
                onSave({
                  id: printer?.id,
                  room_id: roomId,
                  printer_model: model.trim() || null,
                  inventory_item_id: tonerItemId,
                  toner_code: derivedCode,
                  needs_review: needsReview,
                })
              }
              disabled={saving || !roomId}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
