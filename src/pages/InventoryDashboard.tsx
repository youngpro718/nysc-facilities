import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryOverviewPanel } from "@/components/inventory/InventoryOverviewPanel";
import { InventoryItemsPanel } from "@/components/inventory/InventoryItemsPanel";
import { EnhancedSupplyManagement } from "@/components/supply/EnhancedSupplyManagement";
import { InventoryTransactionsPanel } from "@/components/inventory/InventoryTransactionsPanel";
import { LowStockPanel } from "@/components/inventory/LowStockPanel";
import { InventoryAuditsPanel } from "@/components/inventory/InventoryAuditsPanel";
import { Button } from "@/components/ui/button";
import { Package, Plus, TrendingDown, History, Boxes, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const navigate = useNavigate();

  // Fetch initial count of brand new supply requests and subscribe to realtime inserts
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('supply_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'submitted');
      if (!error && typeof count === 'number') {
        setNewRequestsCount(count);
      }
    };

    fetchCount();

    channel = supabase
      .channel('supply-requests-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supply_requests' }, () => {
        fetchCount();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'supply_requests' }, () => {
        fetchCount();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'supply_requests' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Inventory Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track supplies, equipment, and manage stock levels
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => navigate('/admin/supply-requests')}
            className={`w-full sm:w-auto ${newRequestsCount > 0 ? 'animate-pulse ring-2 ring-amber-400/60 shadow-amber-400/30 shadow' : ''}`}
          >
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Supply Requests</span>
            <span className="sm:hidden">Requests</span>
            {newRequestsCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">
                {newRequestsCount}
              </span>
            )}
          </Button>
          <Button onClick={() => setActiveTab("items")} variant="outline" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex overflow-x-auto scrollbar-hide w-full gap-1 sm:grid sm:grid-cols-6 bg-muted">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-[60px] sm:min-w-0">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-[60px] sm:min-w-0">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Items</span>
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-[60px] sm:min-w-0">
            <Boxes className="h-4 w-4" />
            <span className="hidden sm:inline">Supplies</span>
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-[60px] sm:min-w-0">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Low Stock</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-[60px] sm:min-w-0">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="audits" className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-[60px] sm:min-w-0">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audits</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryOverviewPanel />
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <InventoryItemsPanel />
        </TabsContent>

        <TabsContent value="supplies" className="space-y-4">
          <EnhancedSupplyManagement />
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <LowStockPanel />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <InventoryTransactionsPanel />
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <InventoryAuditsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};