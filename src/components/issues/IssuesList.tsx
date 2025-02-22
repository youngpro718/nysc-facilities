
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

export const IssuesList = () => {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const {
    issues,
    isLoading,
    updateIssueMutation,
    deleteIssueMutation,
  } = useIssueQueries();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <IssueListHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'cards' ? (
        <CardView
          issues={issues || []}
          onIssueSelect={setSelectedIssueId}
        />
      ) : (
        <TableView
          issues={issues || []}
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
