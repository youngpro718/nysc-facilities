
import { KeyInventorySection } from "@/components/keys/sections/KeyInventorySection";
import { KeyAssignmentSection } from "@/components/keys/sections/KeyAssignmentSection";
import { KeyHistorySection } from "@/components/keys/sections/KeyHistorySection";
import { KeyOrderSection } from "@/components/keys/sections/KeyOrderSection";
import { ElevatorPassSection } from "@/components/keys/sections/ElevatorPassSection";
import { KeyStatisticsCards } from "@/components/keys/KeyStatisticsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, History, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { KeyData } from "@/components/keys/types/KeyTypes";
import { DataState, useDataState } from "@/ui";

export default function Keys() {
  const keyStatsQuery = useQuery({
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

  const dataStateProps = useDataState(keyStatsQuery);

  return (
    <div className="space-y-4 sm:space-y-6 pb-safe">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold">Key Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage keys, track assignments, and view history
        </p>
      </div>

      <DataState
        {...dataStateProps}
        loadingSkeleton={{ type: 'card', count: 4, height: '120px' }}
        emptyState={{
          title: 'No key data available',
          description: 'Key statistics will appear here once data is available.',
          icon: <KeyRound className="h-6 w-6 text-muted-foreground" />,
        }}
      >
        {(keyStats) => <KeyStatisticsCards keyStats={keyStats} isLoading={false} />}
      </DataState>

      <Tabs defaultValue="inventory" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger 
              value="inventory" 
              className="flex items-center justify-center gap-2"
            >
              <Package className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Inventory & Orders</span>
              <span className="sm:hidden">Keys</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments" 
              className="flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Assignments</span>
              <span className="sm:hidden">Assign</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center justify-center gap-2"
            >
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger 
              value="elevator-passes" 
              className="flex items-center justify-center gap-2"
            >
              <KeyRound className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Elevator Passes</span>
              <span className="sm:hidden">Elevator</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inventory" className="space-y-6 mt-4">
          <KeyInventorySection />
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
