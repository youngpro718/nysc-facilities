import { useState } from "react";
import { Loader2 } from "lucide-react";
import { IssueStatus } from "./types/IssueTypes";
import { IssueDetails } from "./details/IssueDetails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResolutionForm } from "./forms/ResolutionForm";
import { TableView } from "./views/TableView";
import { CardView } from "./views/CardView";
import { IssueListHeader } from "./components/IssueListHeader";
import { useIssueQueries } from "./hooks/useIssueQueries";
import { IssueFiltersType } from "./types/FilterTypes";

export const IssuesList = () => {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
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

  console.log("IssuesList render - filters:", filters);
  console.log("IssuesList render - searchQuery:", searchQuery);
  console.log("IssuesList render - issues:", issues);
  console.log("IssuesList render - isLoading:", isLoading);

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    if (newStatus === 'resolved') {
      setSelectedIssueId(id);
      setShowResolutionForm(true);
    } else {
      updateIssueMutation.mutate({ id, status: newStatus });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      deleteIssueMutation.mutate(id);
    }
  };

  const handleResolutionSuccess = () => {
    setShowResolutionForm(false);
    setSelectedIssueId(null);
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
          onIssueSelect={setSelectedIssueId}
        />
      ) : (
        <TableView
          issues={issues}
          onIssueSelect={setSelectedIssueId}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      <IssueDetails 
        issueId={selectedIssueId} 
        onClose={() => setSelectedIssueId(null)} 
      />

      <Dialog open={showResolutionForm} onOpenChange={setShowResolutionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
          </DialogHeader>
          {selectedIssueId && (
            <ResolutionForm
              issueId={selectedIssueId}
              onSuccess={handleResolutionSuccess}
              onCancel={() => setShowResolutionForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
