import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { QUERY_CONFIG } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, TrendingDown, MapPin, Download, Upload, Camera, ArrowRightLeft, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateItemDialog } from "./CreateItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { ItemPhotoUpload } from "./ItemPhotoUpload";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { FolderCog } from "lucide-react";
import { useToast } from "@shared/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryRealtimeSync } from "@features/inventory/hooks/useOptimizedInventory";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { getGenericItemImage } from "@/utils/inventoryImages";
import { getErrorMessage } from "@/lib/errorUtils";
import { isLowStock, isOutOfStock } from "@features/inventory/utils/stockStatus";
import { invalidateInventoryStockQueries } from "@features/inventory/utils/invalidation";
type InventoryItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  pack_size: number | null;
  packaging_note: string | null;
  pack_label: string | null;
  case_label: string | null;
  case_size: number | null;
  order_code_threshold: number | null;
  status: string;
  location_details: string;
  photo_url: string;
  preferred_vendor: string;
  sku: string | null;
  notes: string;
  category_id: string;
  storage_room_id: string;
  created_at: string;
  updated_at: string;
  requires_justification: boolean | null;
};

type InventoryCategory = {
  id: string;
  name: string;
  color: string;
};

type Room = {
  id: string;
  name: string;
  room_number: string;
};

export const InventoryItemsPanel = () => {
  const { canWrite: canWriteFeature, canAdmin: canAdminFeature, isAdmin } = useRolePermissions();
  const canEdit = canWriteFeature('inventory');
  const canDelete = canAdminFeature('inventory');
  // Category management is stricter than general inventory admin — court_aide/purchasing
  // get inventory:'admin' for item CRUD, but categories are structural and admin-only.
  const canManageCategories = isAdmin;
  const [searchQuery, setSearchQuery] = useState("");
  // Debounced value that actually drives the query. Typing updates `searchQuery`
  // (and the input) instantly, but the query key only changes after a short pause,
  // so we don't fire a request — or remount the panel — on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"name" | "quantity" | "updated_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [bulkTargetRoom, setBulkTargetRoom] = useState<string>("");
  const [selectingAll, setSelectingAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enable real-time synchronization
  useInventoryRealtimeSync();

  // Reference data
  const { data: categories } = useQuery<InventoryCategory[]>({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("id,name,color")
        .order("name");
      if (error) throw error;
      return (data || []) as InventoryCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,room_number")
        .order("name");
      if (error) throw error;
      return (data || []) as Room[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoriesById = useMemo(() => new Map((categories ?? []).map(c => [c.id, c])), [categories]);
  const roomsById = useMemo(() => new Map((rooms ?? []).map(r => [r.id, r])), [rooms]);

  const { data, isLoading, isError, error } = useQuery<{ items: InventoryItem[]; total: number }>({
    queryKey: ["inventory-items", debouncedSearch, page, pageSize, selectedCategory, selectedRoom, sortKey, sortDir],
    queryFn: async () => {
      // Single round trip with relational selects + count + pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("inventory_items")
        .select("*", { count: "exact" })
        .neq("status", "inactive")
        .range(from, to);

      if (debouncedSearch) {
        // Quote the value so names with PostgREST-special chars — ( ) , — don't break
        // the or() filter (e.g. "Batteries (AA)" was returning zero results). Strip any
        // stray quotes/backslashes first so they can't escape the quoted value.
        const safe = debouncedSearch.replace(/["\\]/g, " ").trim();
        query = query.or(`name.ilike."%${safe}%",description.ilike."%${safe}%"`);
      }

      if (selectedCategory && selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }
      if (selectedRoom && selectedRoom !== "all") {
        query = query.eq("storage_room_id", selectedRoom);
      }

      // Sorting
      const ascending = sortDir === "asc";
      query = query.order(sortKey, { ascending });

      const { data, error, count } = await query;
      if (error) throw error;

      const normalized = (data || []) as InventoryItem[];

      // Debug: log count and returned items length to spot RLS or filter issues
      logger.debug('[InventoryItemsPanel] fetched', { totalCount: count, page, pageSize, itemsLength: normalized.length, searchQuery });
      return { items: normalized, total: count ?? 0 };
    },
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 3 * 60 * 1000,
    gcTime: QUERY_CONFIG.gc.short,
    // Keep showing the previous results while the next page/search loads, so the
    // panel (and the focused search box) never unmounts mid-typing.
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to first page (and drop any selection) when search changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch]);

  // Also reset when filters or sort change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [selectedCategory, selectedRoom, sortKey, sortDir, pageSize]);

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Try hard delete first; if FK constraints (transactions, staff_tasks)
      // block it with a 409, fall back to a soft delete so the item disappears
      // from every inventory view without breaking historical references.
      const { error: hardError, count } = await supabase
        .from("inventory_items")
        .delete({ count: "exact" })
        .eq("id", itemId)
        .select("id");

      if (!hardError && (count ?? 0) > 0) return;

      const isFkViolation =
        hardError?.code === "23503" ||
        /foreign key|violates/i.test(hardError?.message ?? "");

      if (hardError && !isFkViolation) throw hardError;

      // Soft delete: mark inactive so lists filter it out but history stays intact.
      const { data: updated, error: softError } = await supabase
        .from("inventory_items")
        .update({ status: "inactive" })
        .eq("id", itemId)
        .select("id");

      if (softError) throw softError;
      if (!updated || updated.length === 0) {
        throw new Error("You do not have permission to delete this item.");
      }
    },
    onSuccess: () => {
      invalidateInventoryStockQueries(queryClient);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "inventory-items" || query.queryKey[0] === "optimized-inventory",
      });
      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete item: ${getErrorMessage(error)}`,
      });
    },
  });

  const chunkIds = (ids: string[], size: number): string[][] => {
    const parts: string[][] = [];
    for (let i = 0; i < ids.length; i += size) parts.push(ids.slice(i, i + size));
    return parts;
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      let removed = 0;
      for (const part of chunkIds(ids, 200)) {
        // Same strategy as single delete: hard delete, soft-delete fallback
        // when FK constraints (transactions, staff_tasks) block it.
        const { data: hardDeleted, error: hardError } = await supabase
          .from("inventory_items")
          .delete()
          .in("id", part)
          .select("id");

        if (!hardError) {
          removed += (hardDeleted ?? []).length;
          continue;
        }

        const isFkViolation =
          hardError.code === "23503" ||
          /foreign key|violates/i.test(hardError.message ?? "");
        if (!isFkViolation) throw hardError;

        const { data: updated, error: softError } = await supabase
          .from("inventory_items")
          .update({ status: "inactive" })
          .in("id", part)
          .select("id");
        if (softError) throw softError;
        removed += (updated ?? []).length;
      }
      if (removed === 0) {
        throw new Error("You do not have permission to delete these items.");
      }
      return removed;
    },
    onSuccess: (removed) => {
      invalidateInventoryStockQueries(queryClient);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "inventory-items" || query.queryKey[0] === "optimized-inventory",
      });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      toast({
        title: "Items deleted",
        description: `Deleted ${removed} item${removed === 1 ? "" : "s"}.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete items: ${getErrorMessage(error)}`,
      });
    },
  });

  const bulkTransferMutation = useMutation({
    mutationFn: async ({ ids, toRoomId }: { ids: string[]; toRoomId: string }) => {
      for (const part of chunkIds(ids, 200)) {
        const { error } = await supabase
          .from("inventory_items")
          .update({ storage_room_id: toRoomId, updated_at: new Date().toISOString() })
          .in("id", part);
        if (error) throw error;
      }
      return ids.length;
    },
    onSuccess: (count, { toRoomId }) => {
      invalidateInventoryStockQueries(queryClient);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "inventory-items" || query.queryKey[0] === "optimized-inventory",
      });
      setSelectedIds(new Set());
      setBulkTransferOpen(false);
      setBulkTargetRoom("");
      const room = roomsById.get(toRoomId);
      toast({
        title: "Items transferred",
        description: `Moved ${count} item${count === 1 ? "" : "s"} to ${room ? room.name : "the selected room"}.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Transfer failed",
        description: getErrorMessage(error),
      });
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select every item matching the current search/filters (not just this page)
  const handleSelectAllMatching = async () => {
    try {
      setSelectingAll(true);
      let query = supabase
        .from("inventory_items")
        .select("id")
        .neq("status", "inactive")
        .range(0, 9999);
      if (debouncedSearch) {
        const safe = debouncedSearch.replace(/["\\]/g, " ").trim();
        query = query.or(`name.ilike."%${safe}%",description.ilike."%${safe}%"`);
      }
      if (selectedCategory && selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }
      if (selectedRoom && selectedRoom !== "all") {
        query = query.eq("storage_room_id", selectedRoom);
      }
      const { data, error } = await query;
      if (error) throw error;
      setSelectedIds(new Set((data ?? []).map((r: { id: string }) => r.id)));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(error) });
    } finally {
      setSelectingAll(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockDialogOpen(true);
  };

  const handlePhotoUpload = (item: InventoryItem) => {
    setSelectedItem(item);
    setPhotoDialogOpen(true);
  };

  const handleDelete = (item: InventoryItem) => {
    setDeleteItemId({ id: item.id, name: item.name });
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      // Fetch all matching rows (cap at 10k)
      let query = supabase
        .from("inventory_items")
        .select("*")
        .range(0, 9999);

      if (debouncedSearch) {
        // Quote the value so names with PostgREST-special chars — ( ) , — don't break
        // the or() filter (e.g. "Batteries (AA)" was returning zero results). Strip any
        // stray quotes/backslashes first so they can't escape the quoted value.
        const safe = debouncedSearch.replace(/["\\]/g, " ").trim();
        query = query.or(`name.ilike."%${safe}%",description.ilike."%${safe}%"`);
      }
      if (selectedCategory && selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }
      if (selectedRoom && selectedRoom !== "all") {
        query = query.eq("storage_room_id", selectedRoom);
      }
      query = query.order(sortKey, { ascending: sortDir === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as InventoryItem[] | null) ?? [];

      const csvRows: Record<string, unknown>[] = rows.map((it) => {
        const cat = categoriesById.get(it.category_id);
        const room = roomsById.get(it.storage_room_id);
        return {
          Name: it.name,
          Quantity: it.quantity,
          Unit: it.unit || "",
          Minimum: it.minimum_quantity,
          Category: cat?.name ?? "",
          Room: room?.name ?? "",
          RoomNumber: room?.room_number ?? "",
          UpdatedAt: it.updated_at,
        };
      });

      const toCsv = (arr: Record<string, unknown>[]) => {
        if (arr.length === 0) return "";
        const headers = Object.keys(arr[0]);
        const esc = (v: unknown) => {
          const s = String(v ?? "");
          const needsQuote = /[",\n]/.test(s);
          const escaped = s.replace(/"/g, '""');
          return needsQuote ? `"${escaped}"` : escaped;
        };
        const lines = [headers.join(","), ...arr.map(r => headers.map(h => esc(r[h])).join(","))];
        return lines.join("\n");
      };

      const csv = toCsv(csvRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_items_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export complete", description: `Exported ${rows.length} items.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Export failed", description: (error as any)?.message ?? String(error) });
    } finally {
      setExporting(false);
    }
  };

  const parseCsv = (text: string): Record<string, string>[] => {
    // Strip UTF-8 BOM if present
    const t = text.replace(/^\uFEFF/, "");
    const rows: string[][] = [];
    let cur: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (inQuotes) {
        if (ch === '"') {
          if (t[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") { cur.push(field); field = ""; }
        else if (ch === "\n" || ch === "\r") {
          if (ch === "\r" && t[i + 1] === "\n") i++;
          cur.push(field); field = "";
          if (cur.some(v => v.length > 0)) rows.push(cur);
          cur = [];
        } else field += ch;
      }
    }
    if (field.length > 0 || cur.length > 0) { cur.push(field); if (cur.some(v => v.length > 0)) rows.push(cur); }
    if (rows.length === 0) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
      return obj;
    });
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    try {
      setImporting(true);
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("No data rows found in file.");

      const catByName = new Map((categories ?? []).map(c => [c.name.trim().toLowerCase(), c.id]));
      const roomByName = new Map((rooms ?? []).map(r => [r.name.trim().toLowerCase(), r.id]));
      const roomByNumber = new Map(
        (rooms ?? [])
          .map(r => [String(r.room_number ?? "").trim().toLowerCase(), r.id] as [string, string])
          .filter(([k]) => k.length > 0)
      );

      // Preload existing items by (name+storage_room_id) so we upsert instead of duplicating.
      const { data: existingRows, error: existingErr } = await supabase
        .from("inventory_items")
        .select("id,name,storage_room_id")
        .range(0, 9999);
      if (existingErr) throw existingErr;
      const existingKey = (name: string, roomId: string | null) => `${name.trim().toLowerCase()}::${roomId ?? ""}`;
      const existingMap = new Map(
        (existingRows ?? []).map((r: { id: string; name: string; storage_room_id: string | null }) => [existingKey(r.name, r.storage_room_id), r.id])
      );

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = (row.Name ?? row.name ?? "").trim();
        if (!name) { skipped++; errors.push(`Row ${i + 2}: missing Name`); continue; }
        const qtyRaw = row.Quantity ?? row.quantity ?? "0";
        const minRaw = row.Minimum ?? row.minimum_quantity ?? row.minimum ?? "";
        const quantity = Number(qtyRaw);
        const minimum_quantity = minRaw === "" ? null : Number(minRaw);
        if (Number.isNaN(quantity) || quantity < 0) { skipped++; errors.push(`Row ${i + 2}: invalid Quantity`); continue; }
        if (minimum_quantity !== null && (Number.isNaN(minimum_quantity) || minimum_quantity < 0)) {
          skipped++; errors.push(`Row ${i + 2}: invalid Minimum`); continue;
        }

        const unit = (row.Unit ?? row.unit ?? "").trim() || null;
        const catName = (row.Category ?? row.category ?? "").trim();
        const category_id = catName ? catByName.get(catName.toLowerCase()) ?? null : null;
        const roomName = (row.Room ?? row.room ?? "").trim();
        const roomNumber = (row.RoomNumber ?? row.room_number ?? "").trim();
        let storage_room_id: string | null = null;
        if (roomName) storage_room_id = roomByName.get(roomName.toLowerCase()) ?? null;
        if (!storage_room_id && roomNumber) storage_room_id = roomByNumber.get(roomNumber.toLowerCase()) ?? null;
        // No Room column (or no match): default to the room currently selected
        // in the filter, so importing "into" a storage room actually lands there.
        if (!storage_room_id && selectedRoom && selectedRoom !== "all") storage_room_id = selectedRoom;

        const key = existingKey(name, storage_room_id);
        const existingId = existingMap.get(key);

        if (existingId) {
          const patch: Record<string, unknown> = { quantity };
          if (minimum_quantity !== null) patch.minimum_quantity = minimum_quantity;
          if (unit !== null) patch.unit = unit;
          if (category_id) patch.category_id = category_id;
          const { error } = await supabase.from("inventory_items").update(patch).eq("id", existingId);
          if (error) { skipped++; errors.push(`Row ${i + 2} (${name}): ${error.message}`); }
          else updated++;
        } else {
          const payload: Record<string, unknown> = {
            name,
            quantity,
            status: "active",
          };
          if (minimum_quantity !== null) payload.minimum_quantity = minimum_quantity;
          if (unit) payload.unit = unit;
          if (category_id) payload.category_id = category_id;
          if (storage_room_id) payload.storage_room_id = storage_room_id;
          const { data: ins, error } = await supabase.from("inventory_items").insert(payload).select("id").maybeSingle();
          if (error) { skipped++; errors.push(`Row ${i + 2} (${name}): ${error.message}`); }
          else {
            inserted++;
            if (ins?.id) existingMap.set(key, ins.id);
          }
        }
      }

      invalidateInventoryStockQueries(queryClient);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "inventory-items" || query.queryKey[0] === "optimized-inventory",
      });

      const summary = `Added ${inserted}, updated ${updated}${skipped ? `, skipped ${skipped}` : ""}.`;
      if (errors.length > 0) {
        logger.error("Inventory import errors:", errors);
        toast({
          variant: skipped === rows.length ? "destructive" : "default",
          title: skipped === rows.length ? "Import failed" : "Import completed with issues",
          description: `${summary} First issue: ${errors[0]}`,
        });
      } else {
        toast({ title: "Import complete", description: summary });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Import failed", description: getErrorMessage(error) });
    } finally {
      setImporting(false);
    }
  };



  const canBulkSelect = canEdit || canDelete;
  const pageIds = items.map((i) => i.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleSelectPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  };

  const getStockStatus = (quantity: number, minimumQuantity: number) => {
    const item = { quantity, minimum_quantity: minimumQuantity };
    if (isOutOfStock(item)) return { label: "Out of Stock", color: "bg-destructive text-destructive-foreground" };
    if (isLowStock(item)) return { label: "Low Stock", color: "bg-destructive/10 text-destructive" };
    return { label: "In Stock", color: "bg-secondary text-secondary-foreground" };
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading inventory items...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        {canEdit && (
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto touch-target">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
        {canManageCategories && (
          <Button
            variant="outline"
            onClick={() => setManageCategoriesOpen(true)}
            className="w-full sm:w-auto touch-target"
          >
            <FolderCog className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Categories</span>
          </Button>
        )}
      </div>
      <ManageCategoriesDialog open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen} />

      {/* Pagination Controls - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          {total > 0 ? (
            <span>
              <span className="hidden sm:inline">Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of </span>
              {total}<span className="hidden sm:inline"> items</span>
            </span>
          ) : (
            <span>No results</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="touch-target"
            aria-label="Previous inventory page"
          >
            <span className="hidden sm:inline">Prev</span>
            <span className="sm:hidden">←</span>
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            <span className="hidden sm:inline">Page </span>{page}<span className="hidden sm:inline"> of {totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="touch-target"
            aria-label="Next inventory page"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">→</span>
          </Button>
        </div>
      </div>

      {/* Filters & Sort - Collapsible on Mobile */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Category</label>
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
              <SelectTrigger className="h-9 bg-background z-50" aria-label="Filter by category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Room</label>
            <Select value={selectedRoom} onValueChange={(v) => setSelectedRoom(v)}>
              <SelectTrigger className="h-9 bg-background z-50" aria-label="Filter by room">
                <SelectValue placeholder="All rooms" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All</SelectItem>
                {(rooms ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} {r.room_number ? `(${r.room_number})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Sort</label>
            <div className="flex gap-2">
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
                <SelectTrigger className="h-9 flex-1 bg-background z-50" aria-label="Sort inventory by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="updated_at">Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as typeof sortDir)}>
                <SelectTrigger className="h-9 w-20 bg-background z-50" aria-label="Inventory sort direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="asc">↑</SelectItem>
                  <SelectItem value="desc">↓</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => { setSelectedCategory("all"); setSelectedRoom("all"); setSortKey("name"); setSortDir("asc"); setSearchQuery(""); }}
            className="w-full sm:w-auto touch-target"
          >
            Reset
          </Button>
          <Button variant="outline" onClick={handleExportCsv} disabled={exporting} className="w-full sm:w-auto touch-target">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              asChild
              disabled={importing}
              className="w-full sm:w-auto touch-target"
            >
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Importing..." : "Import CSV"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleImportCsv}
                  disabled={importing}
                />
              </label>
            </Button>
          )}
        </div>
      </div>

      {/* Bulk selection bar */}
      {canBulkSelect && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <Checkbox
              id="select-page"
              checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectPage}
              aria-label="Select all items on this page"
            />
            <label htmlFor="select-page" className="text-sm cursor-pointer">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all on page"}
            </label>
            {selectedIds.size > 0 && selectedIds.size < total && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={handleSelectAllMatching}
                disabled={selectingAll}
              >
                {selectingAll ? "Selecting…" : `Select all ${total} matching`}
              </Button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setBulkTransferOpen(true)}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer to Room
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} aria-label="Clear selection">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid gap-4">
        {items?.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria." : "Add your first inventory item to get started."}
            </p>
            {!searchQuery && canEdit && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </Card>
        ) : (
          items?.map((item) => {
            const stockStatus = getStockStatus(item.quantity, item.minimum_quantity);
            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {canBulkSelect && (
                      <Checkbox
                        className="mt-1 shrink-0"
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.name}`}
                      />
                    )}
                    {/* Photo thumbnail */}
                    <img
                      src={item.photo_url || getGenericItemImage(item.name)} 
                      alt={item.name}
                      loading="lazy"
                      className="w-16 h-16 object-cover rounded border"
                    />
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-lg break-words">{item.name}</CardTitle>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                        {(() => {
                          const cat = categoriesById.get(item.category_id);
                          if (!cat) return null;
                          return (
                            <Badge variant="outline">
                              {cat.name}
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          Quantity: {item.quantity} {item.unit && `(${item.unit})`}{item.pack_size ? ` · ${item.pack_size}/pack` : ""}
                        </div>
                        {item.minimum_quantity > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />
                            Min: {item.minimum_quantity}
                          </div>
                        )}
                        {(() => {
                          const room = roomsById.get(item.storage_room_id);
                          if (!room) return null;
                          return (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {room.name} {room.room_number ? `(${room.room_number})` : ""}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockAdjustment(item)}
                          aria-label={`Adjust stock for ${item.name}`}
                        >
                          Adjust Stock
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePhotoUpload(item)}
                          title="Upload photo"
                          aria-label={`Upload photo for ${item.name}`}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {(item.description || item.location_details || item.notes) && (
                  <CardContent>
                    <div className="space-y-2">
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      {item.location_details && (
                        <div>
                          <span className="text-sm font-medium">Location: </span>
                          <span className="text-sm text-muted-foreground">{item.location_details}</span>
                        </div>
                      )}
                      {item.preferred_vendor && (
                        <div>
                          <span className="text-sm font-medium">Vendor: </span>
                          <span className="text-sm text-muted-foreground">{item.preferred_vendor}</span>
                        </div>
                      )}
                      {item.notes && (
                        <div className="bg-muted p-2 rounded text-sm">
                          <span className="font-medium">Notes: </span>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="mt-4 rounded border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
          Failed to load items: {String((error as Error)?.message || error)}
        </div>
      )}

      {/* Totals Summary */}
      <div className="mt-4 text-xs text-muted-foreground">
        {total > 0 ? (
          <span>Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span>
        ) : (
          <span>No items available.</span>
        )}
      </div>

      {/* Dialogs */}
      <CreateItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItemId?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId.id, {
                onSuccess: () => setDeleteItemId(null),
              })}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Item{selectedIds.size === 1 ? "" : "s"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size === 1 ? "this item" : `these ${selectedIds.size} items`}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate([...selectedIds])}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting…" : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Transfer Dialog */}
      <Dialog
        open={bulkTransferOpen}
        onOpenChange={(open) => {
          setBulkTransferOpen(open);
          if (!open) setBulkTargetRoom("");
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer {selectedIds.size} Item{selectedIds.size === 1 ? "" : "s"}</DialogTitle>
            <DialogDescription>
              Move the selected items to a different room.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1 block text-xs text-muted-foreground">Destination room</label>
            <Select value={bulkTargetRoom} onValueChange={setBulkTargetRoom}>
              <SelectTrigger aria-label="Destination room">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {(rooms ?? [])
                  .filter((r) => r.id !== selectedRoom)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} {r.room_number ? `(${r.room_number})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkTransferOpen(false)}
              disabled={bulkTransferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => bulkTransferMutation.mutate({ ids: [...selectedIds], toRoomId: bulkTargetRoom })}
              disabled={!bulkTargetRoom || bulkTransferMutation.isPending}
            >
              {bulkTransferMutation.isPending ? "Transferring…" : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedItem && (
        <>
          <EditItemDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            item={selectedItem}
          />
          
          <StockAdjustmentDialog
            open={stockDialogOpen}
            onOpenChange={setStockDialogOpen}
            item={selectedItem}
          />

          <ItemPhotoUpload
            open={photoDialogOpen}
            onOpenChange={setPhotoDialogOpen}
            itemId={selectedItem.id}
            itemName={selectedItem.name}
            currentPhotoUrl={selectedItem.photo_url}
            onPhotoUploaded={() => {
              queryClient.invalidateQueries({ 
                predicate: (query) => query.queryKey[0] === "inventory-items"
              });
            }}
          />
        </>
      )}
    </div>
  );
};
