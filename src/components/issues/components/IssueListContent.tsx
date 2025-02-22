
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IssueFiltersType } from "../types/FilterTypes";
import { IssueStatus } from "../types/IssueTypes";
import { TableView } from "../views/TableView";
import { CardView } from "../views/CardView";
import { IssueListHeader } from "./IssueListHeader";
import { useIssueQueries } from "../hooks/useIssueQueries";
import { useMemo } from "react";
import _ from "lodash";

interface IssueListContentProps {
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  filters: IssueFiltersType;
  setFilters: (filters: IssueFiltersType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'active' | 'historical';
  openDialog: (type: 'issueDetails' | 'resolution', data?: any) => void;
}

export const IssueListContent = ({
  viewMode,
  onViewModeChange,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  activeTab,
  openDialog,
}: IssueListContentProps) => {
  const { toast } = useToast();
  const {
    issues,
    isLoading,
    updateIssueMutation,
    deleteIssueMutation,
  } = useIssueQueries({ filters, searchQuery });

  const handleFilterChange = useMemo(() => 
    _.debounce((newFilters: Partial<IssueFiltersType>) => {
      setFilters(prev => ({
        ...prev,
        ...newFilters
      }));
    }, 300),
    []
  );

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

  return (
    <>
      <IssueListHeader 
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        filters={filters}
        setFilters={handleFilterChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      {viewMode === 'cards' ? (
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
    </>
  );
};
