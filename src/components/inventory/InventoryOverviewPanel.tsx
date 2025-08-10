import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingDown, Folder, Activity, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
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
  category_name: string;
};
export const InventoryOverviewPanel = () => {
  const {
    data: stats
  } = useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const [itemsResult, categoriesResult, transactionsResult] = await Promise.all([supabase.from("inventory_items").select("id", {
        count: "exact"
      }), supabase.from("inventory_categories").select("*", {
        count: "exact"
      }), supabase.from("inventory_item_transactions").select("*", {
        count: "exact"
      }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())]);

      // Get items with minimum quantity set, then filter in JavaScript
      const {
        data: allItems,
        error: itemsError
      } = await supabase.from("inventory_items").select("*").not("minimum_quantity", "is", null).gt("minimum_quantity", 0);
      console.log('Inventory query error:', itemsError);
      console.log('Inventory items found:', allItems);
      if (itemsError) {
        console.error('Error fetching inventory items:', itemsError);
        // Return empty data if table doesn't exist
        return {
          total_items: 0,
          total_categories: 0,
          low_stock_count: 0,
          recent_transactions: 0
        } as InventoryStats;
      }

      // Filter for items that are below minimum quantity
      const lowStockItems = (allItems || []).filter(item => item.minimum_quantity > 0 && item.quantity <= item.minimum_quantity);
      console.log('Low stock items found:', lowStockItems);
      return {
        total_items: itemsResult.count || 0,
        total_categories: categoriesResult.count || 0,
        low_stock_count: lowStockItems.length || 0,
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
  const {
    data: recentTransactions
  } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("inventory_item_transactions").select(`
          id,
          transaction_type,
          quantity,
          created_at,
          performed_by,
          item_id
        `).order("created_at", {
        ascending: false
      }).limit(5);
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      // Get item names separately
      const transactionsWithNames = await Promise.all((data || []).map(async t => {
        let itemName = "Unknown Item";
        if (t.item_id) {
          const {
            data: item
          } = await supabase.from("inventory_items").select("name").eq("id", t.item_id).single();
          itemName = item?.name || "Unknown Item";
        }
        return {
          id: t.id,
          item_name: itemName,
          transaction_type: t.transaction_type,
          quantity: t.quantity,
          created_at: t.created_at,
          performed_by: t.performed_by
        };
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
      } = await supabase.from("inventory_items").select(`
          id,
          name,
          quantity,
          minimum_quantity
        `).not("minimum_quantity", "is", null).gt("minimum_quantity", 0).order("quantity", {
        ascending: true
      });
      if (error) throw error;

      // Filter items that are below minimum quantity
      const filteredItems = (data || []).filter(item => item.quantity <= item.minimum_quantity).slice(0, 5); // Limit to 5 items

      return filteredItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        category_name: "Uncategorized" // Will need to get category separately if needed
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_items || 0}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_categories || 0}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.low_stock_count || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recent_transactions || 0}</div>
            <p className="text-xs text-muted-foreground">Transactions (7 days)</p>
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
                {recentTransactions?.map(transaction => <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTransactionIcon(transaction.transaction_type)}</span>
                      <div>
                        <p className="font-medium">{transaction.item_name}</p>
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
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems?.length === 0 ? <p className="text-muted-foreground text-center py-4">All items are well stocked!</p> : <div className="space-y-3">
                {lowStockItems?.map(item => <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="font-medium text-zinc-950">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category_name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {item.quantity}/{item.minimum_quantity}
                      </Badge>
                      <p className="text-xs text-orange-600 mt-1">Low Stock</p>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};