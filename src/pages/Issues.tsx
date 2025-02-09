
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateIssueDialog } from "@/components/issues/CreateIssueDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateIssueMobileWizard } from "@/components/issues/CreateIssueMobileWizard";
import { IssuesList } from "@/components/issues/IssuesList";
import { LightingManagement } from "@/components/lighting/LightingManagement";
import { IssueStatsBanner } from "@/components/issues/stats/IssueStatsBanner";
import { QuickFilters } from "@/components/issues/filters/QuickFilters";

const Issues = () => {
  const isMobile = useIsMobile();
  
  const handleIssueCreated = async () => {
    // Refresh data or update UI as needed
  };

  return (
    <div className="space-y-6 max-w-full pb-20">
      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="w-full sm:w-auto mb-6 flex">
          <TabsTrigger value="issues" className="flex-1 sm:flex-none text-sm sm:text-base px-2 sm:px-4">
            Issues
          </TabsTrigger>
          <TabsTrigger value="lighting" className="flex-1 sm:flex-none text-sm sm:text-base px-2 sm:px-4">
            Lighting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-6">
          <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
            <h1 className="text-xl sm:text-2xl font-bold">Issues</h1>
            {isMobile ? (
              <CreateIssueMobileWizard onIssueCreated={handleIssueCreated} />
            ) : (
              <CreateIssueDialog onIssueCreated={handleIssueCreated} />
            )}
          </div>

          <div className="space-y-6">
            <IssueStatsBanner />
            <QuickFilters />
            
            <div className="overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <IssuesList />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lighting" className="space-y-6">
          <LightingManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Issues;
