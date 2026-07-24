import { useMemo, useState } from "react";
import { logger } from '@/lib/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, ArrowRight, PackagePlus, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { isLowStock, isOutOfStock, needsAttention } from "@features/inventory/utils/stockStatus";
import { StockAdjustmentDialog } from "@features/inventory/components/inventory/StockAdjustmentDialog";
import { getErrorMessage } from "@/lib/errorUtils";
import { categoryTracksCondition } from "@features/inventory/utils/condition";

type OverviewItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit: string | null;
  category_id: string | null;
  storage_room_id: string | null;
  condition: string | null;
};

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit?: string | null;
  category_name?: string | null;
  room_label?: string | null;
  condition?: string | null;
};

export const InventoryOverviewPanel = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [, setSearchParams] = useSearchParams();
  const [restockItem, setRestockItem] = useState<LowStockItem | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);


  const startDate = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "ytd":
      default: return new Date(now.getFullYear(), 0, 1);
    }
  }, [range]);

  // Single fetch of all active items — feeds the top-line stats AND the
  // Action Needed list below, instead of two separate round-trips pulling
  // the same rows.
  const { data: allItems, isError: itemsIsError, error: itemsError } = useQuery({
    queryKey: ["inventory-overview-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, quantity, minimum_quantity, unit, category_id, storage_room_id, condition")
        .eq("status", "active")
        .order("quantity", { ascending: true });
      if (error) throw error;
      return (data || []) as OverviewItem[];
    },
    staleTime: 3 * 60 * 1000,
    gcTime: QUERY_CONFIG.gc.medium,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Category/room lookups — shares a cache key with the Stock tab, so
  // switching tabs doesn't refetch what's already loaded.
  const { data: categories } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_categories").select("id,name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Every inventory item lives in a storage room, so that's the only set
  // needed for room-label lookups here (also matches the filtered list used
  // by the Stock tab and the create/edit item forms).
  const { data: rooms } = useQuery({
    queryKey: QUERY_KEYS.storageRooms(),
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("id,name,room_number").eq("is_storage", true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoriesById = useMemo(
    () => new Map((categories ?? []).map((c: { id: string; name: string }) => [c.id, c.name])),
    [categories],
  );
  const roomsById = useMemo(
    () => new Map((rooms ?? []).map((r: { id: string; name: string; room_number: string | null }) => [r.id, r])),
    [rooms],
  );

  // Most Used Items
  const { data: mostUsedItems, isError: mostUsedIsError } = useQuery({
    queryKey: ["inventory-most-used", startDate.toISOString()],
    queryFn: async () => {
      const { data: txs, error } = await supabase
        .from("inventory_item_transactions")
        .select("item_id,quantity")
        .in("transaction_type", ["remove", "fulfilled"])
        .gte("created_at", startDate.toISOString());
      if (error) throw error;

      const byItem = new Map<string, number>();
      for (const t of txs || []) {
        if (t.item_id) {
          byItem.set(t.item_id, (byItem.get(t.item_id) || 0) + (t.quantity || 0));
        }
      }

      const topIds = Array.from(byItem.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      if (topIds.length === 0) return [];

      const { data: items } = await supabase
        .from("inventory_items")
        .select("id,name")
        .in("id", topIds.map(([id]) => id));
      const namesById = new Map((items || []).map(i => [i.id, i.name]));

      return topIds.map(([id, qty]) => ({
        id,
        name: namesById.get(id) || "Unknown Item",
        total_used: qty,
      }));
    },
    staleTime: 2 * 60 * 1000,
    gcTime: QUERY_CONFIG.gc.short,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Computed stats — centralized
  const totalItems = allItems?.length ?? 0;
  const outOfStock = allItems?.filter(isOutOfStock).length ?? 0;
  const lowStockCount = allItems?.filter(isLowStock).length ?? 0;
  const hasActionItems = outOfStock > 0 || lowStockCount > 0;

  // Top 5 items needing attention, enriched with room + condition so staff
  // know exactly where to restock, not just what — the same item name can
  // be fine in one room and out in another.
  const lowStockItems = useMemo<LowStockItem[]>(() => {
    if (!allItems) return [];
    return allItems
      .filter(needsAttention)
      .slice(0, 5)
      .map((item) => {
        const room = item.storage_room_id ? roomsById.get(item.storage_room_id) : undefined;
        const roomLabel = room
          ? `${room.name}${room.room_number ? ` (${room.room_number})` : ""}`
          : null;
        const categoryName = item.category_id ? categoriesById.get(item.category_id) ?? null : null;
        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          minimum_quantity: item.minimum_quantity,
          unit: item.unit,
          category_name: categoryName,
          room_label: roomLabel,
          // Only Furniture tracks new/used — showing "New" on every other
          // low-stock alert would just be noise since everything else
          // defaults to it.
          condition: categoryTracksCondition(categoryName) ? item.condition : null,
        };
      });
  }, [allItems, roomsById, categoriesById]);

  const totalLowStockFromQuery = lowStockItems.length;

  return (
    <div className="space-y-6">
      {/* Inline Stats + Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-foreground text-lg">{totalItems}</span>
          <span className="text-muted-foreground">items in catalog</span>
          <span className="text-muted-foreground">·</span>
          {lowStockCount > 0 ? (
            <button
              onClick={() => setSearchParams({ tab: 'alerts' })}
              className="text-destructive font-medium hover:underline cursor-pointer"
            >
              {lowStockCount} low stock
            </button>
          ) : (
            <span className="text-muted-foreground">{lowStockCount} low stock</span>
          )}
          <span className="text-muted-foreground">·</span>
          {outOfStock > 0 ? (
            <span className="text-destructive font-medium">{outOfStock} out of stock</span>
          ) : (
            <span className="text-muted-foreground">{outOfStock} out of stock</span>
          )}
        </div>
        <div className="w-[180px]">
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger>
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {itemsIsError && (
        <div className="rounded border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
          Failed to load inventory overview: {getErrorMessage(itemsError)}
        </div>
      )}

      {/* Action Needed Section */}
      {hasActionItems && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Action Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockItems.length > 0 ? (
              <>
                {lowStockItems.map(item => {
                  const pct = Math.round((item.quantity / item.minimum_quantity) * 100);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          {item.category_name && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {item.category_name}
                            </Badge>
                          )}
                          {item.condition && (
                            <Badge variant={item.condition === "used" ? "secondary" : "outline"} className="text-xs shrink-0">
                              {item.condition === "used" ? "Used" : "New"}
                            </Badge>
                          )}
                        </div>
                        {item.room_label && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.room_label}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground shrink-0">
                            {item.quantity}/{item.minimum_quantity}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-8 text-xs"
                        onClick={() => {
                          setRestockItem(item);
                          setRestockOpen(true);
                        }}
                      >
                        <PackagePlus className="h-3 w-3 mr-1" />
                        Restock
                      </Button>
                    </div>
                  );
                })}
                {lowStockCount > totalLowStockFromQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => setSearchParams({ tab: 'alerts' })}
                  >
                    View all {lowStockCount} low stock items
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </>
            ) : outOfStock > 0 ? (
              <p className="text-sm text-muted-foreground">
                {outOfStock} item{outOfStock !== 1 ? 's' : ''} out of stock.{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => setSearchParams({ tab: 'alerts' })}
                >
                  View alerts →
                </button>
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Most Used Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Most Used Items
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              {range === 'ytd' ? 'Year to date' : range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mostUsedIsError ? (
            <p className="text-destructive text-center py-6 text-sm">Couldn't load usage data. Try refreshing.</p>
          ) : !mostUsedItems || mostUsedItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">No usage data for this period</p>
          ) : (
            <div className="space-y-1">
              {mostUsedItems.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <Badge variant="secondary">{item.total_used} used</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {restockItem && (
        <StockAdjustmentDialog
          open={restockOpen}
          onOpenChange={setRestockOpen}
          item={{
            id: restockItem.id,
            name: restockItem.name,
            quantity: restockItem.quantity,
            unit: restockItem.unit || '',
          }}
        />
      )}
    </div>
  );
};
