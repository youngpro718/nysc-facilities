import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errorUtils';
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Package, TrendingDown, Plus, ShoppingCart } from "lucide-react";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { InventorySparkline } from "@/components/inventory/InventorySparkline";
import { QuickReorderDialog } from "@/components/inventory/QuickReorderDialog";
import { cn } from "@/lib/utils";

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  location_details: string;
  preferred_vendor: string;
  category_name: string;
  category_color: string;
  room_name: string;
  room_number: string;
  storage_room_id: string;
};

// Shared enrichment logic to avoid duplication
async function enrichItems(
  data: Record<string, unknown>[],
  baseItems: LowStockItem[]
): Promise<LowStockItem[]> {
  try {
    const categoryIds = Array.from(new Set(data.map(i => i.category_id as string).filter(Boolean)));
    const roomIds = Array.from(new Set(data.map(i => i.storage_room_id as string).filter(Boolean)));

    const [catsRes, roomsRes] = await Promise.all([
      categoryIds.length
        ? supabase.from('inventory_categories').select('id, name, color').in('id', categoryIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
      roomIds.length
        ? supabase.from('rooms').select('id, name, room_number').in('id', roomIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    ]);

    const catsById = new Map(((catsRes.data as Record<string, unknown>[]) || []).map(c => [c.id as string, c]));
    const roomsById = new Map(((roomsRes.data as Record<string, unknown>[]) || []).map(r => [r.id as string, r]));

    return baseItems.map(it => {
      const raw = data.find(d => d.id === it.id);
      const cat = catsById.get(raw?.category_id as string);
      const room = roomsById.get(it.storage_room_id);
      return {
        ...it,
        category_name: (cat?.name as string) ?? it.category_name,
        category_color: (cat?.color as string) ?? it.category_color,
        room_name: (room?.name as string) ?? it.room_name,
        room_number: (room?.room_number as string) ?? it.room_number,
      };
    });
  } catch (e) {
    if (import.meta.env.DEV) logger.warn('[LowStockPanel] enrichment failed:', e);
    return baseItems;
  }
}

function toBaseItems(data: Record<string, unknown>[]): LowStockItem[] {
  return data.map(item => ({
    id: item.id as string,
    name: item.name as string,
    quantity: item.quantity as number,
    minimum_quantity: (item.minimum_quantity as number) || 0,
    unit: (item.unit as string) || '',
    location_details: (item.location_details as string) || '',
    preferred_vendor: (item.preferred_vendor as string) || '',
    category_name: "Uncategorized",
    category_color: "#6b7280",
    room_name: "",
    room_number: "",
    storage_room_id: item.storage_room_id as string,
  }));
}

export const LowStockPanel = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  } | null>(null);
  const [reorderItem, setReorderItem] = useState<LowStockItem | null>(null);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["out-of-stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-overview"] });
    }
  };

  const { data: lowStockItems, isLoading, isError: lowErr, error: lowError } = useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async (): Promise<LowStockItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("quantity", { ascending: true });

      if (error) throw error;
      const raw = (data || []) as Record<string, unknown>[];
      const base = toBaseItems(raw);
      const enriched = await enrichItems(raw, base);
      return enriched.filter(item => item.quantity > 0 && item.minimum_quantity > 0 && item.quantity < item.minimum_quantity);
    },
  });

  const { data: outOfStockItems, isError: outErr, error: outError } = useQuery({
    queryKey: ["out-of-stock-items"],
    queryFn: async (): Promise<LowStockItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .lte("quantity", 0)
        .order("name");

      if (error) throw error;
      const raw = (data || []) as Record<string, unknown>[];
      const base = toBaseItems(raw);
      return enrichItems(raw, base);
    },
  });

  const openRestock = (item: LowStockItem) => {
    setSelectedItem({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit });
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading low stock items...</div>;
  }

  const CategoryChip = ({ name, color }: { name: string; color: string }) => (
    <Badge variant="outline" className="text-xs">
      <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
      {name}
    </Badge>
  );

  // Shared item card renderer
  const StockItemCard = ({ item, isOutOfStock = false }: { item: LowStockItem; isOutOfStock?: boolean }) => {
    const stockPercent = item.minimum_quantity > 0
      ? Math.min(100, Math.round((item.quantity / item.minimum_quantity) * 100))
      : 0;

    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isOutOfStock ? "bg-destructive/5 border-destructive/20" : "bg-card border-amber-400/20 hover:bg-accent/50"
      )}>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium truncate">{item.name}</h4>
            {isOutOfStock ? (
              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
            ) : (
              <Badge className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300">
                Low Stock
              </Badge>
            )}
            <CategoryChip name={item.category_name} color={item.category_color} />
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>Current: <strong className={isOutOfStock ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>{item.quantity}</strong> {item.unit}</span>
            <span>Min: {item.minimum_quantity} {item.unit}</span>
            {!isOutOfStock && <span>Need: {Math.max(0, item.minimum_quantity - item.quantity)} {item.unit}</span>}
            {item.room_name && <span>{item.room_name} ({item.room_number})</span>}
          </div>

          {/* Trend sparkline */}
          <div className="flex items-center gap-2">
            <InventorySparkline itemId={item.id} height={24} />
            {/* Stock level bar */}
            {!isOutOfStock && item.minimum_quantity > 0 && (
              <Progress 
                value={stockPercent} 
                className="h-1.5 w-full max-w-[120px] [&>div]:bg-amber-500" 
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={isOutOfStock ? "destructive" : "outline"}
            onClick={() => openRestock(item)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isOutOfStock ? 'Restock' : 'Add'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => {
              setReorderItem(item);
              setReorderDialogOpen(true);
            }}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Reorder
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Low Stock Management</h2>
          <p className="text-muted-foreground">Monitor and manage items that need restocking</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible">
        <Card className="shrink-0 w-[220px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", (outOfStockItems?.length || 0) > 0 && "text-destructive")}>
              {outOfStockItems?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[220px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", (lowStockItems?.length || 0) > 0 && "text-amber-600 dark:text-amber-400")}>
              {lowStockItems?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Below minimum levels</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[220px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(outOfStockItems?.length || 0) + (lowStockItems?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Items needing attention</p>
          </CardContent>
        </Card>
      </div>

      {(lowErr || outErr) && (
        <div className="rounded border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
          Failed to load stock data: {lowError ? getErrorMessage(lowError) : outError ? getErrorMessage(outError) : 'Unknown error'}
        </div>
      )}

      {/* Out of Stock Items */}
      {outOfStockItems && outOfStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Out of Stock ({outOfStockItems.length})
          </h3>
          <div className="space-y-2">
            {outOfStockItems.map(item => (
              <StockItemCard key={item.id} item={item} isOutOfStock />
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Low Stock ({lowStockItems.length})
          </h3>
          <div className="space-y-2">
            {lowStockItems.map(item => (
              <StockItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* All Good State */}
      {(!lowStockItems || lowStockItems.length === 0) && (!outOfStockItems || outOfStockItems.length === 0) && (
        <Card className="p-8 text-center bg-card">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">All Items Well Stocked!</h3>
          <p className="text-muted-foreground">
            No items are currently below their minimum stock levels.
          </p>
        </Card>
      )}

      {selectedItem && (
        <StockAdjustmentDialog
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          item={selectedItem}
        />
      )}

      {reorderItem && (
        <QuickReorderDialog
          open={reorderDialogOpen}
          onOpenChange={setReorderDialogOpen}
          item={reorderItem}
        />
      )}
    </div>
  );
};
