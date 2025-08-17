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
import { supabase } from "@/integrations/supabase/client";

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track supplies, equipment, and manage stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/admin/supply-requests')}
            className={newRequestsCount > 0 ? 'animate-pulse ring-2 ring-amber-400/60 shadow-amber-400/30 shadow' : ''}
          >
            <Package className="h-4 w-4 mr-2" />
            Supply Requests
            {newRequestsCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">
                {newRequestsCount} new
              </span>
            )}
          </Button>
          <Button onClick={() => setActiveTab("items")} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Supplies
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="audits" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audits
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