import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateIssueForm } from "@/components/issues/CreateIssueForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateIssueMobileWizard } from "@/components/issues/CreateIssueMobileWizard";
import { IssuesList } from "@/components/issues/IssuesList";
import { LightingManagement } from "@/components/lighting/LightingManagement";
import { IssueStatsBanner } from "@/components/issues/stats/IssueStatsBanner";
import { QuickFilters } from "@/components/issues/filters/QuickFilters";
import { useState } from "react";
import { FormData } from "@/components/issues/types/IssueTypes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Issues = () => {
  const isMobile = useIsMobile();
  const [showIssueForm, setShowIssueForm] = useState(false);
  
  const handleIssueCreated = async () => {
    // Refresh data or update UI as needed
    setShowIssueForm(false);
  };

  const handleIssueSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('issues')
        .insert([{
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority,
          status: data.status,
          assigned_to: data.assigned_to,
          building_id: data.building_id,
          floor_id: data.floor_id,
          room_id: data.room_id,
          photos: data.photos
        }]);

      if (error) throw error;
      
      handleIssueCreated();
      toast.success("Issue created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create issue");
    }
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
              <Button onClick={() => setShowIssueForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Issue
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <IssueStatsBanner />
            <QuickFilters />
            
            {showIssueForm && !isMobile ? (
              <CreateIssueForm onSubmit={handleIssueSubmit} />
            ) : (
              <div className="overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <IssuesList />
              </div>
            )}
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
