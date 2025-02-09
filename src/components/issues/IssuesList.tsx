
import { IssueFilters } from "./IssueFilters";
import { IssueGrid } from "./views/IssueGrid";
import { IssueTable } from "./views/IssueTable";
import { IssueKanban } from "./views/IssueKanban";
import { IssueTimeline } from "./views/IssueTimeline";
import { useIssueData } from "./hooks/useIssueData";
import { useIssueFilters } from "./hooks/useIssueFilters";
import { useIssueActions } from "./hooks/useIssueActions";
import { type Issue } from "./types/IssueTypes";
import { Loader2, LayoutGrid, Table as TableIcon, Kanban, History, Filter } from "lucide-react";
import { ViewMode } from "./types/FilterTypes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const IssuesList = () => {
  const { toast } = useToast();
  const {
    filters,
    setFilters,
    sort,
    setSort,
    grouping,
    setGrouping,
    viewMode,
    setViewMode
  } = useIssueFilters();

  const { data: issues, isLoading, refetch } = useIssueData(filters, sort, grouping);
  
  const {
    handleDeleteIssue,
    handleMarkAsSeen,
    handleUpdate
  } = useIssueActions(refetch);

  const getViewIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'cards':
        return <LayoutGrid className="h-4 w-4" />;
      case 'table':
        return <TableIcon className="h-4 w-4" />;
      case 'kanban':
        return <Kanban className="h-4 w-4" />;
      case 'timeline':
        return <History className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleViewModeChange = (value: ViewMode) => {
    setViewMode(value);
    toast({
      title: "View changed",
      description: `Switched to ${value} view`,
      duration: 2000,
    });
  };

  const renderView = (groupIssues: Issue[]) => {
    switch (viewMode) {
      case 'cards':
        return (
          <div className="animate-in fade-in-50 duration-300">
            <IssueGrid
              issues={groupIssues}
              onDelete={handleDeleteIssue}
              onUpdate={handleUpdate}
              onMarkAsSeen={handleMarkAsSeen}
            />
          </div>
        );
      case 'table':
        return (
          <div className="animate-in fade-in-50 duration-300">
            <IssueTable issues={groupIssues} />
          </div>
        );
      case 'kanban':
        return (
          <div className="animate-in fade-in-50 duration-300">
            <IssueKanban 
              issues={groupIssues}
              onDelete={handleDeleteIssue}
              onUpdate={handleUpdate}
              onMarkAsSeen={handleMarkAsSeen}
            />
          </div>
        );
      case 'timeline':
        return (
          <div className="animate-in fade-in-50 duration-300">
            <IssueTimeline issues={groupIssues} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <Card className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {(['cards', 'table', 'kanban', 'timeline'] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleViewModeChange(mode)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap transition-all duration-200",
                    viewMode === mode && "shadow-lg scale-105"
                  )}
                >
                  {getViewIcon(mode)}
                  <span className="hidden sm:inline capitalize">{mode}</span>
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>

          <Separator className="my-4" />

          <IssueFilters 
            onFilterChange={setFilters}
            onSortChange={setSort}
            onGroupingChange={setGrouping}
            viewMode={viewMode}
          />
        </div>
      </Card>

      <div className="space-y-8">
        {issues && Object.entries(issues.grouped).map(([groupName, groupIssues]) => (
          <div key={groupName} className="space-y-4 animate-in fade-in-50">
            <Card className="sticky top-[130px] z-[5] bg-background/95 backdrop-blur-lg shadow-sm">
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {groupName}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground px-4 py-1 rounded-full bg-muted">
                    {groupIssues.length} {groupIssues.length === 1 ? 'issue' : 'issues'}
                  </span>
                </div>
              </div>
            </Card>
            
            {renderView(groupIssues)}
          </div>
        ))}

        {(!issues || Object.values(issues.grouped).flat().length === 0) && (
          <div className="text-center py-12 text-muted-foreground animate-in fade-in-50">
            <Card className="max-w-md mx-auto p-8">
              <div className="space-y-4">
                <p className="text-lg font-medium">No issues found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or create a new issue
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
