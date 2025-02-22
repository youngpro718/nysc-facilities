
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Issue, IssueStatus, IssuePriority } from "./types/IssueTypes";
import { useState } from "react";
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
import { DatabaseIssue, transformIssue } from "./utils/IssueTransformers";

// Helper function to validate status
const isValidStatus = (status: string | null): status is IssueStatus => {
  return status === 'open' || status === 'in_progress' || status === 'resolved';
};

// Helper function to validate priority
const isValidPriority = (priority: string | null): priority is IssuePriority => {
  return priority === 'low' || priority === 'medium' || priority === 'high';
};

export const IssuesList = () => {
  const queryClient = useQueryClient();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data: issues, isLoading } = useQuery<Issue[]>({
    queryKey: ['issues'],
    queryFn: async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let query = supabase
        .from('issues')
        .select(`
          id,
          title,
          description,
          type,
          status,
          priority,
          created_at,
          updated_at,
          photos,
          seen,
          buildings(name),
          floors(name),
          rooms(name),
          lighting_fixtures(
            name,
            type,
            status,
            position,
            electrical_issues
          )
        `)
        .order('created_at', { ascending: false });

      const typeFilter = urlParams.get('type');
      const statusFilter = urlParams.get('status');
      const priorityFilter = urlParams.get('priority');
      const assignmentFilter = urlParams.get('assigned_to');

      if (typeFilter && typeFilter !== 'all_types') {
        query = query.eq('type', typeFilter);
      }
      
      if (statusFilter && statusFilter !== 'all_statuses') {
        const validStatus = isValidStatus(statusFilter) ? statusFilter : undefined;
        if (validStatus) {
          query = query.eq('status', validStatus);
        }
      }
      
      if (priorityFilter && priorityFilter !== 'all_priorities') {
        const validPriority = isValidPriority(priorityFilter) ? priorityFilter : undefined;
        if (validPriority) {
          query = query.eq('priority', validPriority);
        }
      }

      if (assignmentFilter && assignmentFilter !== 'all_assignments') {
        query = query.eq('assigned_to', assignmentFilter);
      }

      if (typeFilter === 'LIGHTING') {
        const lightingType = urlParams.get('lightingType');
        const fixtureStatus = urlParams.get('fixtureStatus');
        const electricalIssue = urlParams.get('electricalIssue');

        if (lightingType && lightingType !== 'all_lighting_types') {
          query = query.contains('lighting_details', { fixture_type: lightingType });
        }
        
        if (fixtureStatus && fixtureStatus !== 'all_fixture_statuses') {
          query = query.contains('lighting_details', { fixture_status: fixtureStatus });
        }
        
        if (electricalIssue && electricalIssue !== 'all_electrical_issues') {
          query = query.contains('lighting_details->detected_issues', [electricalIssue]);
        }
      }

      const { data: queryData, error } = await query;

      if (error) throw error;
      
      return (queryData || []).map((item) => transformIssue(item as DatabaseIssue));
    }
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IssueStatus }) => {
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update issue status");
      console.error("Error updating issue:", error);
    }
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete issue");
      console.error("Error deleting issue:", error);
    }
  });

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
    queryClient.invalidateQueries({ queryKey: ['issues'] });
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
