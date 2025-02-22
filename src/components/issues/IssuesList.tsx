
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { IssueStatus } from "./types/IssueTypes";
import { IssueDetails } from "./details/IssueDetails";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ResolutionForm } from "./forms/ResolutionForm";
import { TableView } from "./views/TableView";
import { CardView } from "./views/CardView";
import { IssueListHeader } from "./components/IssueListHeader";
import { useIssueQueries } from "./hooks/useIssueQueries";
import { IssueFiltersType } from "./types/FilterTypes";
import { useDialogManager } from "@/hooks/useDialogManager";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueStats } from "./components/IssueStats";

export const IssuesList = () => {
  const { toast } = useToast();
  const { dialogState, openDialog, closeDialog } = useDialogManager();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeTab, setActiveTab] = useState<'active' | 'historical'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<IssueFiltersType>({
    type: 'all_types',
    status: activeTab === 'active' ? 'all_statuses' : 'resolved',
    priority: 'all_priorities',
    assigned_to: 'all_assignments',
    lightingType: 'all_lighting_types',
    fixtureStatus: 'all_fixture_statuses',
    electricalIssue: 'all_electrical_issues'
  });

  const {
    issues,
    isLoading,
    updateIssueMutation,
    deleteIssueMutation,
  } = useIssueQueries({ 
    filters: {
      ...filters,
      status: activeTab === 'historical' ? 'resolved' : filters.status
    }, 
    searchQuery 
  });

  const handleTabChange = (tab: 'active' | 'historical') => {
    setActiveTab(tab);
    setFilters(prev => ({
      ...prev,
      status: tab === 'historical' ? 'resolved' : 'all_statuses'
    }));
  };

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    if (newStatus === 'resolved') {
      openDialog('resolution', { issueId: id });
    } else {
      updateIssueMutation.mutate(
        { id, status: newStatus },
        {
          onSuccess: () => {
            toast({
              title: "Status updated",
              description: `Issue status changed to ${newStatus}`,
            });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      deleteIssueMutation.mutate(id, {
        onSuccess: () => {
          toast({
            title: "Issue deleted",
            description: "The issue has been successfully deleted.",
          });
        },
      });
    }
  };

  const handleFilterChange = (newFilters: Partial<IssueFiltersType>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!issues || issues.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
          <p>No issues found</p>
        </div>
      );
    }

    return viewMode === 'cards' ? (
      <CardView
        issues={issues}
        onIssueSelect={(id) => openDialog('issueDetails', { issueId: id })}
      />
    ) : (
      <TableView
        issues={issues}
        onIssueSelect={(id) => openDialog('issueDetails', { issueId: id })}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <>
      <IssueStats />
      
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'active' | 'historical')} className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Issues</TabsTrigger>
          <TabsTrigger value="historical">Historical Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <IssueListHeader 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            setFilters={handleFilterChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          {renderContent()}
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <IssueListHeader 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            setFilters={handleFilterChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          {renderContent()}
        </TabsContent>
      </Tabs>

      {dialogState.type === 'issueDetails' && (
        <Sheet 
          open={dialogState.isOpen} 
          onOpenChange={handleSheetOpenChange}
        >
          <SheetContent side="right" className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
            <IssueDetails 
              issueId={dialogState.data?.issueId} 
              onClose={closeDialog}
            />
          </SheetContent>
        </Sheet>
      )}

      {dialogState.type === 'resolution' && (
        <Sheet 
          open={dialogState.isOpen} 
          onOpenChange={handleSheetOpenChange}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Resolve Issue</SheetTitle>
            </SheetHeader>
            <ResolutionForm
              issueId={dialogState.data?.issueId}
              onSuccess={closeDialog}
              onCancel={closeDialog}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
