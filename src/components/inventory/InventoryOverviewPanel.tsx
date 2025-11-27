import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingDown, Folder, Activity, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type InventoryStats = {
  total_items: number;
  total_categories: number;
  low_stock_count: number;
  total_value: number;
  recent_transactions: number;
};

type RecentTransaction = {
  id: string;
  item_name: string;
  transaction_type: string;
  quantity: number;
  created_at: string;
  performed_by: string;
};

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  category_name?: string | null;
};

export const InventoryOverviewPanel = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [typeFilter, setTypeFilter] = useState<"all" | "add" | "remove" | "adjustment">("all");

  const startDate = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "ytd":
      default:
        return new Date(now.getFullYear(), 0, 1);
    }
  }, [range]);

  const {
    data: stats
  } = useQuery({
    queryKey: ["inventory-stats", startDate.toISOString(), typeFilter],
    queryFn: async () => {
      const txCountQuery = supabase
        .from("inventory_item_transactions")
        .select("*", { count: "exact" })
        .gte("created_at", startDate.toISOString());
      if (typeFilter !== "all") txCountQuery.eq("transaction_type", typeFilter);

      const [itemsResult, categoriesResult, transactionsResult] = await Promise.all([
        supabase.from("inventory_items").select("id", { count: "exact" }),
        supabase.from("inventory_categories").select("*", { count: "exact" }),
        txCountQuery,
      ]);

      // Count low stock items where quantity > 0 and quantity <= minimum_quantity
      // Note: This requires fetching all items to compare quantity with minimum_quantity
      const { data: allItems } = await supabase
        .from("inventory_items")
        .select("quantity, minimum_quantity");
      
      const lowStockCount = (allItems || []).filter(
        item => item.quantity > 0 && item.minimum_quantity > 0 && item.quantity < item.minimum_quantity
      ).length;
      
      const lowStockError = null;
      if (lowStockError) {
        console.error('Error counting low stock items:', lowStockError);
      }
      return {
        total_items: itemsResult.count || 0,
        total_categories: categoriesResult.count || 0,
        low_stock_count: lowStockCount || 0,
        recent_transactions: transactionsResult.count || 0
      } as InventoryStats;
    },
    staleTime: 3 * 60 * 1000,
    // 3 minutes
    gcTime: 10 * 60 * 1000,
    // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  const { data: analytics } = useQuery({
    queryKey: [
      "inventory-analytics",
      startDate.toISOString(),
      typeFilter,
    ],
    queryFn: async () => {
      // Fetch transactions in range (optionally filtered by type)
      let txQuery = supabase
        .from("inventory_item_transactions")
        .select("id,item_id,transaction_type,quantity,created_at")
        .gte("created_at", startDate.toISOString());
      if (typeFilter !== "all") txQuery = txQuery.eq("transaction_type", typeFilter);
      const { data: txs, error: txError } = await txQuery;
      if (txError) throw txError;

      const byDay: Record<string, { adds: number; removes: number; adjustments: number; net: number }> = {};
      let adds = 0, removes = 0, adjustments = 0;
      const removedByItem = new Map<string, number>();

      for (const t of txs || []) {
        const day = format(new Date(t.created_at as string), "yyyy-MM-dd");
        if (!byDay[day]) byDay[day] = { adds: 0, removes: 0, adjustments: 0, net: 0 };
        if (t.transaction_type === "add") {
          byDay[day].adds += t.quantity || 0;
          adds += t.quantity || 0;
          byDay[day].net += t.quantity || 0;
        } else if (t.transaction_type === "remove") {
          byDay[day].removes += t.quantity || 0;
          removes += t.quantity || 0;
          byDay[day].net -= t.quantity || 0;
          if (t.item_id) {
            removedByItem.set(t.item_id, (removedByItem.get(t.item_id) || 0) + (t.quantity || 0));
          }
        } else if (t.transaction_type === "adjustment") {
          adjustments += t.quantity || 0;
          byDay[day].adjustments += t.quantity || 0;
        }
      }

      const netFlow = adds - removes;

      // Fetch item names and categories for removed items
      const itemIds = Array.from(removedByItem.keys());
      let itemsById = new Map<string, { name: string; category_id: string | null }>();
      if (itemIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("inventory_items")
          .select("id,name,category_id")
          .in("id", itemIds);
        for (const it of itemsData || []) {
          itemsById.set(it.id, { name: it.name, category_id: it.category_id });
        }
      }

      // Build top items removed
      const topItemsRemoved = Array.from(removedByItem.entries())
        .map(([item_id, qty]) => ({
          item_id,
          name: itemsById.get(item_id)?.name || "Unknown Item",
          quantity: qty,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Build top categories removed
      const categoryTotals = new Map<string | null, number>();
      for (const [item_id, qty] of removedByItem.entries()) {
        const catId = itemsById.get(item_id)?.category_id ?? null;
        categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + qty);
      }
      const catIds = Array.from(new Set(Array.from(categoryTotals.keys()).filter((id): id is string => !!id)));
      const categoriesById = new Map<string, string>();
      if (catIds.length > 0) {
        const { data: catsData } = await supabase
          .from("inventory_categories")
          .select("id,name")
          .in("id", catIds);
        for (const c of catsData || []) categoriesById.set(c.id, c.name);
      }
      const topCategoriesRemoved = Array.from(categoryTotals.entries())
        // Exclude items without a category to avoid showing fallback labels
        .filter(([category_id]) => !!category_id)
        .map(([category_id, qty]) => ({
          category_id,
          name: categoriesById.get(category_id as string) || "Unknown Category",
          quantity: qty,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const trend = Object.entries(byDay)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 7);

      return {
        netFlow,
        totals: { adds, removes, adjustments },
        trend,
        topItemsRemoved,
        topCategoriesRemoved,
      } as const;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  const {
    data: recentTransactions
  } = useQuery({
    queryKey: ["recent-transactions", startDate.toISOString(), typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("inventory_item_transactions")
        .select(
          `
          id,
          transaction_type,
          quantity,
          created_at,
          performed_by,
          item_id
        `
        )
        .gte("created_at", startDate.toISOString());
      if (typeFilter !== "all") query = query.eq("transaction_type", typeFilter);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(5);
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      // Batch fetch item names to avoid N+1 queries
      const itemIds = Array.from(new Set((data || []).map((t) => t.item_id).filter(Boolean)));
      const itemsById = new Map<string, { name: string }>();
      if (itemIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("inventory_items")
          .select("id,name")
          .in("id", itemIds as string[]);
        if (!itemsError) {
          for (const it of itemsData || []) {
            itemsById.set(it.id, { name: it.name });
          }
        } else {
          console.error('Error fetching item names for recent transactions:', itemsError);
        }
      }

      const transactionsWithNames = (data || []).map((t) => ({
        id: t.id,
        item_name: t.item_id ? (itemsById.get(t.item_id)?.name || "Unknown Item") : "Unknown Item",
        transaction_type: t.transaction_type,
        quantity: t.quantity,
        created_at: t.created_at,
        performed_by: t.performed_by,
      }));
      return transactionsWithNames as RecentTransaction[];
    },
    staleTime: 2 * 60 * 1000,
    // 2 minutes
    gcTime: 5 * 60 * 1000,
    // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
  const {
    data: lowStockItems
  } = useQuery({
    queryKey: ["low-stock-overview"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase
        .from("inventory_items")
        .select(`
          id,
          name,
          quantity,
          minimum_quantity,
          category_id
        `)
        .order("quantity", { ascending: true });
      if (error) throw error;

      // Filter items that are below their minimum_quantity
      const filteredItems = (data || []).filter(item => 
        (item?.quantity || 0) > 0 && 
        (item?.minimum_quantity || 0) > 0 && 
        (item?.quantity || 0) < (item?.minimum_quantity || 0)
      );

      // Enrich with category names
      const categoryIds = Array.from(new Set(filteredItems.map((i: any) => i.category_id).filter(Boolean)));
      const categoriesById = new Map<string, string>();
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("inventory_categories")
          .select("id,name")
          .in("id", categoryIds as string[]);
        for (const c of (cats || []) as any[]) categoriesById.set(c.id, c.name);
      }

      const limited = filteredItems.slice(0, 5); // Limit to 5 items
      return limited.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity || 0,
        // Only include a category name if we have one; otherwise leave undefined/null
        category_name: categoriesById.get(item.category_id) ?? null
      })) as LowStockItem[];
    },
    staleTime: 2 * 60 * 1000,
    // 2 minutes
    gcTime: 5 * 60 * 1000,
    // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "add":
        return "📦";
      case "remove":
        return "📤";
      case "adjustment":
        return "⚖️";
      default:
        return "📋";
    }
  };
  const getTransactionColor = (type: string) => {
    switch (type) {
      case "add":
        return "text-green-600";
      case "remove":
        return "text-red-600";
      case "adjustment":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };
  return <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-[180px]">
            <Select value={range} onValueChange={(v) => setRange(v as any)}>
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
          <div className="w-[220px]">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="add">Adds</SelectItem>
                <SelectItem value="remove">Removes</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
        <Card className="shrink-0 w-[280px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_items || 0}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[280px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_categories || 0}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[280px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.low_stock_count || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[280px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recent_transactions || 0}</div>
            <p className="text-xs text-muted-foreground">Transactions ({range === 'ytd' ? 'YTD' : range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'})</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics: Trends and Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Trends (range)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Adds</span>
                  <span className="font-medium">{analytics.totals.adds || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Removes</span>
                  <span className="font-medium">{analytics.totals.removes || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Adjustments</span>
                  <span className="font-medium">{analytics.totals.adjustments || 0}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm">Net Flow</span>
                  <span className={`font-semibold ${((analytics.netFlow || 0) >= 0) ? "text-green-600" : "text-red-600"}`}>
                    {(analytics.netFlow || 0) >= 0 ? "+" : ""}{analytics.netFlow || 0}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Recent days</p>
                  <div className="space-y-1">
                    {analytics.trend.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No activity</p>
                    ) : (
                      analytics.trend.map((d) => (
                        <div key={d.date} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{d.date}</span>
                          <span className="font-medium">
                            {d.net >= 0 ? "+" : ""}{d.net} (A {d.adds} | R {d.removes} | Adj {d.adjustments})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items Removed */}
        <Card>
          <CardHeader>
            <CardTitle>Top Items Removed</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics || analytics.topItemsRemoved.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {analytics.topItemsRemoved.map((it) => (
                  <div key={it.item_id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{it.name}</span>
                    <Badge variant="outline">{it.quantity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories Removed */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories Removed</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics || analytics.topCategoriesRemoved.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {analytics.topCategoriesRemoved.map((c) => (
                  <div key={c.category_id ?? "uncategorized"} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{c.name}</span>
                    <Badge variant="outline">{c.quantity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions?.length === 0 ? <p className="text-muted-foreground text-center py-4">No recent transactions</p> : <div className="space-y-3">
                {recentTransactions?.map(transaction => <div key={transaction.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTransactionIcon(transaction.transaction_type)}</span>
                      <div>
                        <p className="font-medium text-foreground">{transaction.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), "MMM dd, HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === "add" ? "+" : "-"}{transaction.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {transaction.transaction_type}
                      </p>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems?.length === 0 ? <p className="text-muted-foreground text-center py-4">All items are well stocked!</p> : <div className="space-y-3">
                {lowStockItems?.map(item => <div key={item.id} className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      {item.category_name && (
                        <p className="text-sm text-muted-foreground">{item.category_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {item.quantity}/{item.minimum_quantity}
                      </Badge>
                      <p className="text-xs text-destructive mt-1">Low Stock</p>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};