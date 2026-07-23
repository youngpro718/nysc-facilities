import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryOverviewPanel } from "@features/inventory/components/inventory/InventoryOverviewPanel";
import { InventoryItemsPanel } from "@features/inventory/components/inventory/InventoryItemsPanel";
import { InventoryTransactionsPanel } from "@features/inventory/components/inventory/InventoryTransactionsPanel";
import { LowStockPanel } from "@features/inventory/components/inventory/LowStockPanel";
import { InventoryAuditsPanel } from "@features/inventory/components/inventory/InventoryAuditsPanel";
import { StorageRoomsPanel } from "@features/inventory/components/inventory/StorageRoomsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
// Note: Tooltip imports retained for other elements; per-tab tooltips removed because TooltipTrigger asChild was overwriting TabsTrigger's data-state.
import { Package, Plus, History, BarChart3, MapPin, AlertTriangle, Warehouse } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { needsAttention } from "@features/inventory/utils/stockStatus";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

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
  // Derive the active tab from the URL instead of mirroring it in state:
  // child panels (e.g. the Overview "Action Needed" links) switch tabs via
  // setSearchParams, which never updated the old useState copy — clicks
  // changed the URL but the page didn't move.
  const activeTab = searchParams.get('tab') || 'overview';
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const { userRole } = useRolePermissions();
  const canOrderSupplies = userRole !== 'court_aide';

  const handleTabChange = (tab: string) => {
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

      // Low stock count — centralized rule (includes out-of-stock for tracked items)
      const { data: stockItems } = await supabase
        .from('inventory_items')
        .select('id, quantity, minimum_quantity')
        .eq('status', 'active');
      const lowCount = (stockItems || []).filter(needsAttention).length;
      setLowStockCount(lowCount);

      // Total items count
      const { count: totalCount } = await supabase
        .from('inventory_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
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
          <PageHeader
            title="Inventory"
            description="Track stock levels and manage supplies"
            icon={Warehouse}
            className="mb-0"
          >
            <Button
              onClick={() => navigate('/admin/supply-requests')}
              variant="outline"
              className={`w-full sm:w-auto ${newRequestsCount > 0 ? 'ring-2 ring-status-warning/60 shadow-status-warning/30 shadow' : ''}`}
            >
              <Package className="h-4 w-4 mr-2" />
              Requests
              {newRequestsCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-status-warning text-white">
                  {newRequestsCount}
                </Badge>
              )}
            </Button>
            {canOrderSupplies && (
              <Button onClick={() => navigate('/request/supplies')} className="w-full sm:w-auto" data-tour="inventory-order">
                <Plus className="h-4 w-4 mr-2" />
                Order Supplies
              </Button>
            )}
          </PageHeader>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-end gap-2 p-3 bg-muted/50 rounded-lg border" data-tour="inventory-search">
            {lowStockCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleTabChange('alerts')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {lowStockCount} Need attention
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


        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                title={tab.tooltip}
                className="flex items-center gap-1.5 px-2 py-2"
              >
                {tab.icon}
                <span className="text-xs md:text-sm">{tab.label}</span>
                {tab.badge !== undefined && (
                  <Badge
                    variant={tab.badgeVariant || "secondary"}
                    className="ml-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
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
