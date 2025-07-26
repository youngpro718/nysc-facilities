import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryOverviewPanel } from "@/components/inventory/InventoryOverviewPanel";
import { InventoryItemsPanel } from "@/components/inventory/InventoryItemsPanel";
import { EnhancedSupplyManagement } from "@/components/supply/EnhancedSupplyManagement";
import { InventoryTransactionsPanel } from "@/components/inventory/InventoryTransactionsPanel";
import { LowStockPanel } from "@/components/inventory/LowStockPanel";
import { InventoryAuditsPanel } from "@/components/inventory/InventoryAuditsPanel";
import { Button } from "@/components/ui/button";
import { Package, Plus, TrendingDown, History, Boxes, BarChart3 } from "lucide-react";

export const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

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