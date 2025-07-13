
import { KeyInventorySection } from "@/components/keys/sections/KeyInventorySection";
import { KeyAssignmentSection } from "@/components/keys/sections/KeyAssignmentSection";
import { KeyHistorySection } from "@/components/keys/sections/KeyHistorySection";
import { KeyOrderSection } from "@/components/keys/sections/KeyOrderSection";
import { KeyStatisticsCards } from "@/components/keys/KeyStatisticsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, History, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyData } from "@/components/keys/types/KeyTypes";

export default function Keys() {
  const { data: keyStats, isLoading } = useQuery({
    queryKey: ["keys-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_inventory_view")
        .select(`
          id,
          name,
          type,
          status,
          total_quantity,
          available_quantity,
          is_passkey,
          key_scope,
          properties,
          location_data,
          active_assignments,
          returned_assignments,
          lost_count
        `);

      if (error) throw error;
      
      return data as KeyData[];
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Key Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage keys, track assignments, and view history
        </p>
      </div>

      <KeyStatisticsCards keyStats={keyStats} isLoading={isLoading} />

      <Tabs defaultValue="inventory" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="w-full min-w-max flex h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger 
              value="inventory" 
              className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="assignments" 
              className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <KeyInventorySection />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-4">
          <KeyOrderSection />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 mt-4">
          <KeyAssignmentSection />
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <KeyHistorySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
