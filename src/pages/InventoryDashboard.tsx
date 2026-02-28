import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryOverviewPanel } from "@/components/inventory/InventoryOverviewPanel";
import { InventoryItemsPanel } from "@/components/inventory/InventoryItemsPanel";
import { InventoryTransactionsPanel } from "@/components/inventory/InventoryTransactionsPanel";
import { LowStockPanel } from "@/components/inventory/LowStockPanel";
import { InventoryAuditsPanel } from "@/components/inventory/InventoryAuditsPanel";
import { StorageRoomsPanel } from "@/components/inventory/StorageRoomsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Package, Plus, History, BarChart3, MapPin, AlertTriangle, Search, Warehouse, Boxes } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { FORCED_MINIMUM } from "@/constants/inventory";
import { StatusCard } from "@/components/ui/StatusCard";

interface TabConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  tooltip: string;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export const InventoryDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
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

      // Low stock count
      const { count: lowCount } = await supabase
        .from('inventory_items')
        .select('id', { count: 'exact', head: true })
        .gt('quantity', 0)
        .lte('quantity', FORCED_MINIMUM);
      if (typeof lowCount === 'number') setLowStockCount(lowCount);

      // Total items count
      const { count: totalCount } = await supabase
        .from('inventory_items')
        .select('id', { count: 'exact', head: true });
      if (typeof totalCount === 'number') setTotalItems(totalCount);
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

  // Tab configuration with tooltips
  const tabs: TabConfig[] = [
    {
      id: "overview",
      label: "Overview",
      shortLabel: "Overview",
      icon: <BarChart3 className="h-4 w-4" />,
      tooltip: "Dashboard with stats and trends"
    },
    {
      id: "stock",
      label: "Stock",
      shortLabel: "Stock",
      icon: <Package className="h-4 w-4" />,
      tooltip: "View and manage all inventory items"
    },
    {
      id: "alerts",
      label: "Alerts",
      shortLabel: "Alerts",
      icon: <AlertTriangle className="h-4 w-4" />,
      tooltip: "Items running low or needing reorder",
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeVariant: "destructive"
    },
    {
      id: "storage",
      label: "Storage Rooms",
      shortLabel: "Storage",
      icon: <MapPin className="h-4 w-4" />,
      tooltip: "View inventory by storage location"
    },
    {
      id: "history",
      label: "History",
      shortLabel: "History",
      icon: <History className="h-4 w-4" />,
      tooltip: "Transaction logs and audit trail"
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Warehouse className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Inventory</h1>
                <p className="text-sm text-muted-foreground">
                  Track stock levels and manage supplies
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => navigate('/admin/supply-requests')}
                variant="outline"
                className={`w-full sm:w-auto ${newRequestsCount > 0 ? 'ring-2 ring-amber-400/60 shadow-amber-400/30 shadow' : ''}`}
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Requests</span>
                <span className="sm:hidden">Requests</span>
                {newRequestsCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-500 text-white">
                    {newRequestsCount}
                  </Badge>
                )}
              </Button>
              <Button onClick={() => handleTabChange("stock")} className="w-full sm:w-auto" data-tour="inventory-add">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border" data-tour="inventory-search">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="h-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearch.trim()) {
                    handleTabChange('stock');
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              {lowStockCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleTabChange('alerts')}
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
                <span className="hidden sm:inline">Recent Activity</span>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard statusVariant="info" title="Total Items" value={totalItems} subLabel="In catalog" icon={Boxes} />
          <StatusCard statusVariant={lowStockCount > 0 ? "critical" : "operational"} title="Low Stock" value={lowStockCount} subLabel="Need reorder" icon={AlertTriangle} onClick={() => handleTabChange('alerts')} />
          <StatusCard statusVariant={newRequestsCount > 0 ? "warning" : "operational"} title="Pending Requests" value={newRequestsCount} subLabel="Awaiting review" icon={Package} onClick={() => navigate('/admin/supply-requests')} />
          <StatusCard statusVariant="operational" title="System Status" value="OK" subLabel="All systems normal" icon={BarChart3} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            {tabs.map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value={tab.id} 
                    className="flex items-center gap-1.5 px-2 py-2 data-[state=active]:bg-background"
                  >
                    {tab.icon}
                    <span className="hidden md:inline text-sm">{tab.label}</span>
                    <span className="inline md:hidden text-xs">{tab.shortLabel}</span>
                    {tab.badge !== undefined && (
                      <Badge 
                        variant={tab.badgeVariant || "secondary"} 
                        className="ml-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tab.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <InventoryOverviewPanel />
          </TabsContent>

          <TabsContent value="stock" className="mt-4 space-y-4">
            <InventoryItemsPanel />
          </TabsContent>

          <TabsContent value="alerts" className="mt-4 space-y-4" data-tour="inventory-alerts">
            <LowStockPanel />
          </TabsContent>

          <TabsContent value="storage" className="mt-4 space-y-4">
            <StorageRoomsPanel />
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            <div className="space-y-6">
              <InventoryTransactionsPanel />
              <InventoryAuditsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};
