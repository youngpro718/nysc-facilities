import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryOverviewPanel } from "@/components/inventory/InventoryOverviewPanel";
import { InventoryItemsPanel } from "@/components/inventory/InventoryItemsPanel";
import { EnhancedSupplyManagement } from "@/components/supply/EnhancedSupplyManagement";
import { InventoryTransactionsPanel } from "@/components/inventory/InventoryTransactionsPanel";
import { LowStockPanel } from "@/components/inventory/LowStockPanel";
import { InventoryAuditsPanel } from "@/components/inventory/InventoryAuditsPanel";
import { StorageRoomsPanel } from "@/components/inventory/StorageRoomsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, TrendingDown, History, Boxes, BarChart3, MapPin, AlertTriangle, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const InventoryDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();

  // Sync tab with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch counts for badges
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const fetchCounts = async () => {
      // Supply requests count
      const { count: reqCount } = await supabase
        .from('supply_requests')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'pending']);
      if (typeof reqCount === 'number') setNewRequestsCount(reqCount);

      // Low stock count - fetch items to compare quantity with minimum_quantity
      const { data: allItems } = await supabase
        .from('inventory_items')
        .select('quantity, minimum_quantity');
      
      const lowCount = (allItems || []).filter(
        item => item.quantity > 0 && item.minimum_quantity > 0 && item.quantity <= item.minimum_quantity
      ).length;
      if (typeof lowCount === 'number') setLowStockCount(lowCount);
    };

    fetchCounts();

    channel = supabase
      .channel('inventory-dashboard-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_requests' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, fetchCounts)
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <Breadcrumb />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                <Badge variant="secondary" className="ml-2 bg-amber-500 text-white">
                  {newRequestsCount}
                </Badge>
              )}
            </Button>
            <Button onClick={() => handleTabChange("items")} variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-48 h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearch.trim()) {
                  handleTabChange('items');
                }
              }}
            />
          </div>
          <div className="flex-1" />
          {lowStockCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleTabChange('items')}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              {lowStockCount} Low Stock
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange('history')}
          >
            <History className="h-4 w-4 mr-1" />
            Recent Activity
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Items</span>
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Low Stock</span>
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {lowStockCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="storage-rooms" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Storage</span>
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            <span className="hidden sm:inline">Supplies</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryOverviewPanel />
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <InventoryItemsPanel />
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <LowStockPanel />
        </TabsContent>

        <TabsContent value="storage-rooms" className="space-y-4">
          <StorageRoomsPanel />
        </TabsContent>

        <TabsContent value="supplies" className="space-y-4">
          <EnhancedSupplyManagement />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-6">
            <InventoryTransactionsPanel />
            <InventoryAuditsPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};