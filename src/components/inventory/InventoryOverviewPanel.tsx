import { useMemo, useState } from "react";
import { logger } from '@/lib/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, ArrowRight, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  category_name?: string | null;
};

export const InventoryOverviewPanel = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  // Fetch all items for stats + low stock in one query
  const { data: allItems } = useQuery({
    queryKey: ["inventory-overview-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, quantity, minimum_quantity, category_id")
        .order("quantity", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Most Used Items
  const { data: mostUsedItems } = useQuery({
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
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Low stock items with category names
  const { data: lowStockItems } = useQuery({
    queryKey: ["low-stock-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, quantity, minimum_quantity, category_id")
        .gt("quantity", 0)
        .order("quantity", { ascending: true });
      if (error) throw error;

      const filtered = (data || []).filter(
        item => item.minimum_quantity > 0 && item.quantity < item.minimum_quantity
      );

      const categoryIds = Array.from(new Set(filtered.map(i => i.category_id).filter(Boolean))) as string[];
      const categoriesById = new Map<string, string>();
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("inventory_categories")
          .select("id,name")
          .in("id", categoryIds);
        for (const c of cats || []) categoriesById.set(c.id, c.name);
      }

      return filtered.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        category_name: item.category_id ? categoriesById.get(item.category_id) ?? null : null,
      })) as LowStockItem[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Computed stats
  const totalItems = allItems?.length ?? 0;
  const outOfStock = allItems?.filter(i => i.quantity <= 0).length ?? 0;
  const lowStockCount = allItems?.filter(
    i => i.minimum_quantity > 0 && i.quantity > 0 && i.quantity < i.minimum_quantity
  ).length ?? 0;
  const totalLowStockFromQuery = lowStockItems?.length ?? 0;
  const hasActionItems = outOfStock > 0 || lowStockCount > 0;

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
            {lowStockItems && lowStockItems.length > 0 ? (
              <>
                {lowStockItems.map(item => {
                  const pct = Math.round((item.quantity / item.minimum_quantity) * 100);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          {item.category_name && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {item.category_name}
                            </Badge>
                          )}
                        </div>
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
                        onClick={() => navigate('/request/supplies')}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Reorder
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
          {!mostUsedItems || mostUsedItems.length === 0 ? (
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
    </div>
  );
};
