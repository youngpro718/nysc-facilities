
import { KeyInventorySection } from "@/components/keys/sections/KeyInventorySection";
import { KeyAssignmentSection } from "@/components/keys/sections/KeyAssignmentSection";
import { KeyHistorySection } from "@/components/keys/sections/KeyHistorySection";
import { KeyOrderSection } from "@/components/keys/sections/KeyOrderSection";
import { ElevatorPassSection } from "@/components/keys/sections/ElevatorPassSection";
import { KeyStatisticsCards } from "@/components/keys/KeyStatisticsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, History, ShoppingCart, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { KeyData } from "@/components/keys/types/KeyTypes";

export default function Keys() {
  const { data: keyStats, isLoading } = useQuery({
    queryKey: ["keys-stats"],
    queryFn: async () => {
      // Use the new key statistics view for proper data aggregation
      const { data: keysData, error: keysError } = await supabase
        .from("key_statistics_view")
        .select("*");

      if (keysError) {
        console.error("Error fetching key statistics:", keysError);
        throw keysError;
      }
      
      return keysData as KeyData[];
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
            <TabsTrigger 
              value="elevator-passes" 
              className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Elevator Passes
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

        <TabsContent value="elevator-passes" className="space-y-4 mt-4">
          <ElevatorPassSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
