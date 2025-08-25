
import { KeyInventorySection } from "@/components/keys/sections/KeyInventorySection";
import { KeyAssignmentSection } from "@/components/keys/sections/KeyAssignmentSection";
import { KeyHistorySection } from "@/components/keys/sections/KeyHistorySection";
import { KeyOrderSection } from "@/components/keys/sections/KeyOrderSection";
import { ElevatorPassSection } from "@/components/keys/sections/ElevatorPassSection";
import { KeyStatisticsCards } from "@/components/keys/KeyStatisticsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, History, ShoppingCart, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyData } from "@/components/keys/types/KeyTypes";

export default function Keys() {
  const { data: keyStats, isLoading } = useQuery({
    queryKey: ["keys-stats"],
    queryFn: async () => {
      // Get key data from base table
      const { data: keysData, error: keysError } = await supabase
        .from("keys")
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
          captain_office_copy,
          captain_office_assigned_date,
          captain_office_notes,
          created_at,
          updated_at
        `);

      if (keysError) throw keysError;

      // Get assignment statistics (aggregated per key)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("key_assignment_stats")
        .select(`
          key_id,
          active_assignments,
          returned_assignments,
          lost_count
        `)
        .returns<{
          key_id: string;
          active_assignments: number | null;
          returned_assignments: number | null;
          lost_count: number | null;
        }[]>();

      if (assignmentError) throw assignmentError;

      // Merge the data
      const mergedData = keysData?.map(key => {
        const assignments = assignmentData?.find(a => a.key_id === key.id);
        return {
          ...key,
          active_assignments: assignments?.active_assignments || 0,
          returned_assignments: assignments?.returned_assignments || 0,
          lost_count: assignments?.lost_count || 0,
          assigned_count: assignments?.active_assignments || 0, // For backward compatibility
          stock_status: key.status // For backward compatibility
        };
      }) || [];
      
      return mergedData as KeyData[];
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

      {/* Debug info */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <p className="text-blue-700">Debug: Keys component is rendering</p>
        <p className="text-blue-700">Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p className="text-blue-700">Key stats count: {keyStats?.length || 0}</p>
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
