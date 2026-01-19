import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, BarChart3, Archive, TrendingDown, ClipboardList } from "lucide-react";
import { InventoryOverviewPanel } from "./InventoryOverviewPanel";
import { InventoryItemsPanel } from "./InventoryItemsPanel";
import { InventoryCategoriesPanel } from "./InventoryCategoriesPanel";
import { InventoryTransactionsPanel } from "./InventoryTransactionsPanel";
import { LowStockPanel } from "./LowStockPanel";
import { StaffTasksPanel } from "./StaffTasksPanel";

export const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">
            Track supplies and equipment across all locations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package size={16} />
            Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Archive size={16} />
            Categories
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Plus size={16} />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="flex items-center gap-2">
            <TrendingDown size={16} />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="staff-tasks" className="flex items-center gap-2">
            <ClipboardList size={16} />
            Staff Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <InventoryOverviewPanel />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <InventoryItemsPanel />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <InventoryCategoriesPanel />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <InventoryTransactionsPanel />
        </TabsContent>

        <TabsContent value="low-stock" className="mt-6">
          <LowStockPanel />
        </TabsContent>

        <TabsContent value="staff-tasks" className="mt-6">
          <StaffTasksPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};