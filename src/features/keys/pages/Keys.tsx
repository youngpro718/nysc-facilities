
import { KeyInventorySection } from "@features/keys/components/keys/sections/KeyInventorySection";
import { logger } from '@/lib/logger';
import { KeyAssignmentSection } from "@features/keys/components/keys/sections/KeyAssignmentSection";
import { KeyHistorySection } from "@features/keys/components/keys/sections/KeyHistorySection";
import { KeyOrderSection } from "@features/keys/components/keys/sections/KeyOrderSection";
import { ElevatorPassSection } from "@features/keys/components/keys/sections/ElevatorPassSection";
import { KeyStatisticsCards } from "@features/keys/components/keys/KeyStatisticsCards";
import { LockboxView } from "@features/keys/components/keys/lockbox/LockboxView";
import { LockboxManagement } from "@features/keys/components/keys/lockbox/LockboxManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, History, KeyRound, Box, Settings, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { KeyData } from "@features/keys/components/keys/types/KeyTypes";
import { DataState, useDataState } from "@/ui/DataState";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { MobileKeyManagement } from "@features/keys/components/keys/mobile/MobileKeyManagement";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Keys() {
  const { canAdmin } = useRolePermissions();
  const canManageKeys = canAdmin('keys');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ["lockbox", "inventory", "assignments", "history", "elevator-passes", "manage"];
  const requestedTab = searchParams.get("tab") ?? "lockbox";
  const activeTab = validTabs.includes(requestedTab) ? requestedTab : "lockbox";
  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  const keyStatsQuery = useQuery({
    queryKey: ["keys-stats"],
    queryFn: async () => {
      // Use the new key statistics view for proper data aggregation
      const { data: keysData, error: keysError } = await supabase
        .from("key_statistics_view")
        .select("*");

      if (keysError) {
        logger.error("Error fetching key statistics:", keysError);
        throw keysError;
      }

      return keysData as KeyData[];
    },
  });

  const dataStateProps = useDataState(keyStatsQuery);

  if (isMobile) {
    return <MobileKeyManagement />;
  }

  return (
    <div className="flex flex-col h-[calc(100svh-140px)] min-h-[520px] pb-safe">
      <div className="shrink-0 space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            title="Key Management"
            description="Manage keys, track assignments, and view history"
            icon={KeyRound}
            className="mb-0 flex-1"
          />
          <Button
            variant="default"
            size="lg"
            className="shrink-0 h-12 rounded-xl gap-2 shadow-sm"
            onClick={() => navigate("/keys/kiosk")}
          >
            <Monitor className="h-5 w-5" />
            Kiosk Mode
          </Button>
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
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col mt-4 sm:mt-6">
        <div className="shrink-0 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex sm:grid sm:w-full sm:grid-cols-6 bg-muted min-w-max sm:min-w-0 h-10 sm:h-10" data-tour="keys-tabs">
            <TabsTrigger
              value="lockbox"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation"
            >
              <Box className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Lockbox</span>
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation"
            >
              <Package className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Keys</span>
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation"
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Assign</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation"
            >
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">History</span>
            </TabsTrigger>
            <TabsTrigger
              value="elevator-passes"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation"
            >
              <KeyRound className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Passes</span>
            </TabsTrigger>
            {canManageKeys && (
              <TabsTrigger
                value="manage"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 touch-manipulation"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Manage</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="lockbox" className="flex-1 min-h-0 overflow-y-auto space-y-6 mt-4">
          <LockboxView />
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 min-h-0 overflow-y-auto space-y-6 mt-4">
          <KeyInventorySection />
          <KeyOrderSection />
        </TabsContent>

        <TabsContent value="assignments" className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4">
          <KeyAssignmentSection />
        </TabsContent>

        <TabsContent value="history" className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4">
          <KeyHistorySection />
        </TabsContent>

        <TabsContent value="elevator-passes" className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4">
          <ElevatorPassSection />
        </TabsContent>

        {canManageKeys && (
          <TabsContent value="manage" className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold">Lockbox Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage lockboxes, view statistics, and organize key storage locations
              </p>
            </div>
            <LockboxManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
