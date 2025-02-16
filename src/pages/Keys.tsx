
import { KeyInventorySection } from "@/components/keys/sections/KeyInventorySection";
import { KeyAssignmentSection } from "@/components/keys/sections/KeyAssignmentSection";
import { KeyHistorySection } from "@/components/keys/sections/KeyHistorySection";
import { KeyStatisticsCards } from "@/components/keys/KeyStatisticsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyData } from "@/components/keys/types/KeyTypes";

export default function Keys() {
  const { data: keyStats, isLoading } = useQuery({
    queryKey: ["keys-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
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
          key_assignments (id)
        `);

      if (error) throw error;
      
      // Transform the data to ensure key_scope is correctly typed
      return data.map(key => ({
        ...key,
        key_scope: key.key_scope === 'door' || key.key_scope === 'room' 
          ? key.key_scope 
          : 'door' // Default to 'door' if invalid value
      })) as KeyData[];
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Key Management</h1>
        <p className="text-muted-foreground">
          Manage keys, track assignments, and view history
        </p>
      </div>

      <KeyStatisticsCards keyStats={keyStats} isLoading={isLoading} />

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <KeyInventorySection />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <KeyAssignmentSection />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <KeyHistorySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
