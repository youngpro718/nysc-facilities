import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, TrendingDown, MapPin, Download, Camera } from "lucide-react";
import { CreateItemDialog } from "./CreateItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { ItemPhotoUpload } from "./ItemPhotoUpload";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryRealtimeSync } from "@/hooks/optimized/useOptimizedInventory";
type InventoryItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  status: string;
  location_details: string;
  photo_url: string;
  preferred_vendor: string;
  vendor_sku: string;
  notes: string;
  category_id: string;
  storage_room_id: string;
  created_at: string;
  updated_at: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"name" | "quantity" | "updated_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exporting, setExporting] = useState(false);
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
    queryKey: ["inventory-items", searchQuery, page, pageSize, selectedCategory, selectedRoom, sortKey, sortDir],
    queryFn: async () => {
      // Single round trip with relational selects + count + pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("inventory_items")
        .select("*", { count: "exact" })
        .range(from, to);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
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
      console.debug('[InventoryItemsPanel] fetched', { totalCount: count, page, pageSize, itemsLength: normalized.length, searchQuery });
      return { items: normalized, total: count ?? 0 };
    },
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Also reset when filters or sort change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedRoom, sortKey, sortDir, pageSize]);

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate ALL inventory queries
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "inventory-items"
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
        description: "Failed to delete item: " + error.message,
      });
    },
  });

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

  const handleDelete = async (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      // Fetch all matching rows (cap at 10k)
      let query = supabase
        .from("inventory_items")
        .select("*")
        .range(0, 9999);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }
      if (selectedRoom) {
        query = query.eq("storage_room_id", selectedRoom);
      }
      query = query.order(sortKey, { ascending: sortDir === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as InventoryItem[] | null) ?? [];

      const csvRows: Record<string, any>[] = rows.map((it) => {
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

      const toCsv = (arr: Record<string, any>[]) => {
        if (arr.length === 0) return "";
        const headers = Object.keys(arr[0]);
        const esc = (v: any) => {
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
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export failed", description: e?.message ?? String(e) });
    } finally {
      setExporting(false);
    }
  };

  const getStockStatus = (quantity: number, minimumQuantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", color: "bg-destructive text-destructive-foreground" };
    if (quantity > 0 && quantity <= minimumQuantity) return { label: "Low Stock", color: "bg-destructive/10 text-destructive" };
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
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto touch-target">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

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
              <SelectTrigger className="h-9 bg-background z-50">
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
              <SelectTrigger className="h-9 bg-background z-50">
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
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger className="h-9 flex-1 bg-background z-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="updated_at">Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
                <SelectTrigger className="h-9 w-20 bg-background z-50">
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
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid gap-4">
        {items?.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria." : "Add your first inventory item to get started."}
            </p>
            {!searchQuery && (
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
                  <div className="flex items-start justify-between gap-4">
                    {/* Photo thumbnail if exists */}
                    {item.photo_url && (
                      <img 
                        src={item.photo_url} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          Quantity: {item.quantity} {item.unit && `(${item.unit})`}
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
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStockAdjustment(item)}
                      >
                        Adjust Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePhotoUpload(item)}
                        title="Upload photo"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          Failed to load items: {String((error as any)?.message || error)}
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