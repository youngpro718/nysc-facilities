import { useMemo, useState } from "react";
import { logger } from '@/lib/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingDown, Folder, Activity, AlertTriangle, MapPin } from "lucide-react";
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
    queryKey: ["inventory-stats", startDate.toISOString()],
    queryFn: async () => {
      const txCountQuery = supabase
        .from("inventory_item_transactions")
        .select("*", { count: "exact" })
        .gte("created_at", startDate.toISOString());

      const [itemsResult, categoriesResult, transactionsResult] = await Promise.all([
        supabase.from("inventory_items").select("id", { count: "exact" }),
        supabase.from("inventory_categories").select("*", { count: "exact" }),
        txCountQuery,
      ]);

      // Count low stock items: quantity > 0 AND quantity < minimum_quantity
      // We need to fetch all items and filter client-side since Supabase doesn't support column-to-column comparison
      const { data: allItems, error: lowStockError } = await supabase
        .from("inventory_items")
        .select("id, quantity, minimum_quantity")
        .gt("quantity", 0);
      if (lowStockError) {
        logger.error('Error counting low stock items:', lowStockError);
      }
      // Filter items where quantity < minimum_quantity (and minimum_quantity > 0)
      const lowStockCount = (allItems || []).filter(
        item => item.minimum_quantity > 0 && item.quantity < item.minimum_quantity
      ).length;
      
      return {
        total_items: itemsResult.count || 0,
        total_categories: categoriesResult.count || 0,
        low_stock_count: lowStockCount,
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

  // Most Used Items — items with the most "remove" transactions in the period
  const { data: mostUsedItems } = useQuery({
    queryKey: ["inventory-most-used", startDate.toISOString()],
    queryFn: async () => {
      const { data: txs, error } = await supabase
        .from("inventory_item_transactions")
        .select("item_id,quantity")
        .eq("transaction_type", "remove")
        .gte("created_at", startDate.toISOString());
      if (error) throw error;

      // Aggregate quantity removed per item
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

      // Fetch item names
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

  // Usage by Room — which rooms/offices consume the most inventory
  const { data: usageByRoom } = useQuery({
    queryKey: ["inventory-usage-by-room", startDate.toISOString()],
    queryFn: async () => {
      const { data: txs, error } = await supabase
        .from("inventory_item_transactions")
        .select("item_id,quantity")
        .eq("transaction_type", "remove")
        .gte("created_at", startDate.toISOString());
      if (error) throw error;

      // Aggregate quantity removed per item
      const byItem = new Map<string, number>();
      for (const t of txs || []) {
        if (t.item_id) {
          byItem.set(t.item_id, (byItem.get(t.item_id) || 0) + (t.quantity || 0));
        }
      }

      if (byItem.size === 0) return [];

      // Fetch items with their storage room
      const { data: items } = await supabase
        .from("inventory_items")
        .select("id,storage_room_id")
        .in("id", Array.from(byItem.keys()));

      // Aggregate by room
      const byRoom = new Map<string, number>();
      for (const item of items || []) {
        if (item.storage_room_id) {
          const qty = byItem.get(item.id) || 0;
          byRoom.set(item.storage_room_id, (byRoom.get(item.storage_room_id) || 0) + qty);
        }
      }

      const topRooms = Array.from(byRoom.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      if (topRooms.length === 0) return [];

      // Fetch room names
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id,name,room_number")
        .in("id", topRooms.map(([id]) => id));
      const roomsById = new Map((rooms || []).map(r => [r.id, r]));

      return topRooms.map(([id, qty]) => {
        const room = roomsById.get(id);
        return {
          id,
          name: room ? `${room.name}${room.room_number ? ` (${room.room_number})` : ""}` : "Unknown Room",
          total_used: qty,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  const {
    data: recentTransactions
  } = useQuery({
    queryKey: ["recent-transactions", startDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_item_transactions")
        .select(`
          id,
          transaction_type,
          quantity,
          created_at,
          performed_by,
          item_id
        `)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) {
        logger.error('Error fetching transactions:', error);
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
          logger.error('Error fetching item names for recent transactions:', itemsError);
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
        .gt("quantity", 0)
        .order("quantity", { ascending: true });
      if (error) throw error;

      // Filter items where quantity < minimum_quantity (actual low stock)
      const filteredItems = (data || []).filter(
        item => item.minimum_quantity > 0 && item.quantity < item.minimum_quantity
      );

      // Enrich with category names
      const categoryIds = Array.from(new Set(filteredItems.map((i) => i.category_id).filter(Boolean))) as string[];
      const categoriesById = new Map<string, string>();
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("inventory_categories")
          .select("id,name")
          .in("id", categoryIds);
        for (const c of cats || []) categoriesById.set(c.id, c.name);
      }

      const limited = filteredItems.slice(0, 5); // Limit to 5 items
      return limited.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        // Only include a category name if we have one; otherwise leave undefined/null
        category_name: item.category_id ? categoriesById.get(item.category_id) ?? null : null
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
        return "text-green-600 dark:text-green-400";
      case "remove":
        return "text-red-600 dark:text-red-400";
      case "adjustment":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600";
    }
  };
  return <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex items-center gap-3">
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

      {/* Usage Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Most Used Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mostUsedItems || mostUsedItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No usage data yet</p>
            ) : (
              <div className="space-y-3">
                {mostUsedItems.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
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

        {/* Usage by Room */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Usage by Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!usageByRoom || usageByRoom.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No usage data yet</p>
            ) : (
              <div className="space-y-3">
                {usageByRoom.map((room, i) => (
                  <div key={room.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm font-medium">{room.name}</span>
                    </div>
                    <Badge variant="secondary">{room.total_used} items</Badge>
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