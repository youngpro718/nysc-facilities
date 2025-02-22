
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

export const IssuesList = () => {
  const { toast } = useToast();
  const { dialogState, openDialog, closeDialog } = useDialogManager();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<IssueFiltersType>({
    type: 'all_types',
    status: 'all_statuses',
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
  } = useIssueQueries({ filters, searchQuery });

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    if (newStatus === 'resolved') {
      openDialog('resolution', { issueId: id });
    } else {
      updateIssueMutation.mutate({ id, status: newStatus });
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

  const handleResolutionSuccess = () => {
    closeDialog();
    toast({
      title: "Issue resolved",
      description: "The issue has been successfully resolved.",
    });
  };

  const handleFilterChange = (newFilters: Partial<IssueFiltersType>) => {
    console.log("Updating filters with:", newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return (
    <>
      <IssueListHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        setFilters={handleFilterChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !issues || issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
          <p>No issues found</p>
        </div>
      ) : viewMode === 'cards' ? (
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
      )}

      {dialogState.type === 'issueDetails' && (
        <Sheet open={dialogState.isOpen} onOpenChange={closeDialog}>
          <SheetContent side="right" className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
            <IssueDetails 
              issueId={dialogState.data?.issueId} 
              onClose={closeDialog}
            />
          </SheetContent>
        </Sheet>
      )}

      {dialogState.type === 'resolution' && (
        <Sheet open={dialogState.isOpen} onOpenChange={closeDialog}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Resolve Issue</SheetTitle>
            </SheetHeader>
            <ResolutionForm
              issueId={dialogState.data?.issueId}
              onSuccess={handleResolutionSuccess}
              onCancel={closeDialog}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
