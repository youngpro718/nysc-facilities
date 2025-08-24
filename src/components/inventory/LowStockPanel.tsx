import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown, Plus } from "lucide-react";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";

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

export const LowStockPanel = () => {
  // Realtime handled by global RealtimeProvider; queries will be invalidated centrally
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  } | null>(null);

  // TEMP: Force minimum threshold to 3 for testing across this panel
  const FORCED_MINIMUM = 3;

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Refresh lists after a successful adjustment/close
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["out-of-stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-overview"] }); // overview card
    }
  };

  const { data: lowStockItems, isLoading, isError: lowErr, error: lowError } = useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async (): Promise<LowStockItem[]> => {
      // Fetch items and compute low stock client-side using a forced minimum
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("quantity", { ascending: true });

      if (error) throw error;
      // Base mapping
      const base = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: FORCED_MINIMUM,
        unit: item.unit || '',
        location_details: item.location_details || '',
        preferred_vendor: item.preferred_vendor || '',
        category_name: "Uncategorized",
        category_color: "#6b7280", // default gray-500
        room_name: "",
        room_number: "",
        storage_room_id: item.storage_room_id,
      }));

      // Optional enrichment: categories and rooms
      try {
        const categoryIds = Array.from(new Set((data || []).map((i: any) => i.category_id).filter(Boolean)));
        const roomIds = Array.from(new Set((data || []).map((i: any) => i.storage_room_id).filter(Boolean)));

        const [catsRes, roomsRes] = await Promise.all([
          categoryIds.length
            ? supabase.from('inventory_categories').select('id, name, color').in('id', categoryIds)
            : Promise.resolve({ data: [], error: null } as any),
          roomIds.length
            ? supabase.from('rooms').select('id, name, room_number').in('id', roomIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        const catsById = new Map(((catsRes.data as any[]) || []).map((c: any) => [c.id, c]));
        const roomsById = new Map(((roomsRes.data as any[]) || []).map((r: any) => [r.id, r]));

        const enriched = base.map((it: any) => {
          const cat = catsById.get((data as any[]).find(d => d.id === it.id)?.category_id);
          const room = roomsById.get(it.storage_room_id);
          return {
            ...it,
            category_name: cat?.name ?? it.category_name,
            category_color: cat?.color ?? it.category_color,
            room_name: room?.name ?? it.room_name,
            room_number: room?.room_number ?? it.room_number,
          } as LowStockItem;
        });

        return enriched.filter(item => item.quantity > 0 && item.quantity <= FORCED_MINIMUM);
      } catch (e) {
        console.warn('[LowStockPanel] enrichment failed, using base data:', e);
        return base.filter(item => item.quantity > 0 && item.quantity <= FORCED_MINIMUM);
      }
    },
  });

  const { data: outOfStockItems, isError: outErr, error: outError } = useQuery({
    queryKey: ["out-of-stock-items"],
    queryFn: async (): Promise<LowStockItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("quantity", 0)
        .order("name");

      if (error) throw error;
      const base = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: FORCED_MINIMUM,
        unit: item.unit || '',
        location_details: item.location_details || '',
        preferred_vendor: item.preferred_vendor || '',
        category_name: "Uncategorized",
        category_color: "#6b7280",
        room_name: "",
        room_number: "",
        storage_room_id: item.storage_room_id,
      }));
      try {
        const categoryIds = Array.from(new Set((data || []).map((i: any) => i.category_id).filter(Boolean)));
        const roomIds = Array.from(new Set((data || []).map((i: any) => i.storage_room_id).filter(Boolean)));
        const [catsRes, roomsRes] = await Promise.all([
          categoryIds.length
            ? supabase.from('inventory_categories').select('id, name, color').in('id', categoryIds)
            : Promise.resolve({ data: [], error: null } as any),
          roomIds.length
            ? supabase.from('rooms').select('id, name, room_number').in('id', roomIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);
        const catsById = new Map(((catsRes.data as any[]) || []).map((c: any) => [c.id, c]));
        const roomsById = new Map(((roomsRes.data as any[]) || []).map((r: any) => [r.id, r]));
        return base.map((it: any) => {
          const cat = catsById.get((data as any[]).find(d => d.id === it.id)?.category_id);
          const room = roomsById.get(it.storage_room_id);
          return {
            ...it,
            category_name: cat?.name ?? it.category_name,
            category_color: cat?.color ?? it.category_color,
            room_name: room?.name ?? it.room_name,
            room_number: room?.room_number ?? it.room_number,
          } as LowStockItem;
        });
      } catch (e) {
        console.warn('[LowStockPanel] enrichment (OOS) failed, using base data:', e);
        return base;
      }
    },
  });

  const getStockLevel = (quantity: number, minimum: number) => {
    if (quantity === 0) {
      return {
        level: "critical",
        label: "Out of Stock",
        badgeVariant: "destructive" as const,
        badgeClass: "",
      };
    }
    if (quantity > 0 && quantity <= minimum) {
      return {
        level: "warning",
        label: "Low Stock",
        // Amber scheme with good contrast
        badgeVariant: undefined,
        badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-200/20 dark:text-amber-300",
      } as const;
    }
    return {
      level: "ok",
      label: "OK",
      badgeVariant: undefined,
      badgeClass: "bg-muted text-foreground",
    } as const;
  };

  const CategoryChip = ({ name, color }: { name: string; color: string }) => {
    // Render neutral badge with small color dot to avoid unreadable text-on-color
    return (
      <Badge variant="outline">
        <span className="inline-block h-2 w-2 rounded-full mr-2" style={{ backgroundColor: color }} />
        {name}
      </Badge>
    );
  };

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      orange: "bg-orange-100 text-orange-800",
      purple: "bg-purple-100 text-purple-800",
      yellow: "bg-yellow-100 text-yellow-800",
      pink: "bg-pink-100 text-pink-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading low stock items...</div>;
  }

  const criticalItems = lowStockItems?.filter(item => getStockLevel(item.quantity, item.minimum_quantity).level === "critical") || [];
  const lowItems = lowStockItems?.filter(item => getStockLevel(item.quantity, item.minimum_quantity).level === "warning") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Low Stock Management</h2>
          <p className="text-muted-foreground">Monitor and manage items that need restocking</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">Very low levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowItems.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Items */}
      {outOfStockItems && outOfStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Out of Stock Items
          </h3>
          <div className="grid gap-4">
            {outOfStockItems.map((item) => (
              <Card key={item.id} className="border-destructive/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant="destructive">Out of Stock</Badge>
                        <CategoryChip name={item.category_name} color={item.category_color} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Current: {item.quantity} {item.unit}</span>
                        <span>Required: {item.minimum_quantity} {item.unit}</span>
                        {item.room_name && (
                          <span>Location: {item.room_name} ({item.room_number})</span>
                        )}
                      </div>
                      {item.preferred_vendor && (
                        <p className="text-sm text-muted-foreground">
                          Vendor: {item.preferred_vendor}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedItem({
                          id: item.id,
                          name: item.name,
                          quantity: item.quantity,
                          unit: item.unit,
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Restock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(lowErr || outErr) && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
          Failed to load some stock data: {String((lowError as any)?.message || lowError || (outError as any)?.message || outError)}
        </div>
      )}

      {/* Low Stock Items */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            Low Stock Items
          </h3>
          <div className="grid gap-4">
            {lowStockItems.map((item) => {
              const stockLevel = getStockLevel(item.quantity, item.minimum_quantity);
              return (
                <Card key={item.id} className={stockLevel.level === "critical" ? "border-destructive/20" : "border-orange-200"}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{item.name}</h4>
                          {stockLevel.badgeVariant ? (
                            <Badge variant={stockLevel.badgeVariant}>{stockLevel.label}</Badge>
                          ) : (
                            <Badge className={stockLevel.badgeClass}>{stockLevel.label}</Badge>
                          )}
                          <CategoryChip name={item.category_name} color={item.category_color} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Current: {item.quantity} {item.unit}</span>
                          <span>Minimum: {item.minimum_quantity} {item.unit}</span>
                          <span>Need: {Math.max(0, item.minimum_quantity - item.quantity)} {item.unit}</span>
                          {item.room_name && (
                            <span>Location: {item.room_name} ({item.room_number})</span>
                          )}
                        </div>
                        {item.preferred_vendor && (
                          <p className="text-sm text-muted-foreground">
                            Vendor: {item.preferred_vendor}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem({
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No Low Stock Items */}
      {(!lowStockItems || lowStockItems.length === 0) && (!outOfStockItems || outOfStockItems.length === 0) && (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-green-800">All Items Well Stocked!</h3>
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
    </div>
  );
};
