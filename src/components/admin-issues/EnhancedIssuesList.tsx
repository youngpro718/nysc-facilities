import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { EnhancedIssueCard } from "./EnhancedIssueCard";
import { IssueTableView } from "./IssueTableView";
import { IssueTimelineView } from "./IssueTimelineView";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";
import type { GroupingMode, ViewMode } from "@/pages/AdminIssuesHub";

interface EnhancedIssuesListProps {
  issues: EnhancedIssue[];
  groupingMode: GroupingMode;
  viewMode: ViewMode;
  searchQuery: string;
  selectedIssues: string[];
  onSelectionChange: (issueIds: string[]) => void;
  onIssueUpdate: () => void;
  isLoading: boolean;
  buildingId?: string | null;
  filter?: string | null;
}

export function EnhancedIssuesList({
  issues,
  groupingMode,
  viewMode,
  searchQuery,
  selectedIssues,
  onSelectionChange,
  onIssueUpdate,
  isLoading,
  buildingId,
  filter
}: EnhancedIssuesListProps) {
  // Filter issues based on search query, building, and filter
  const filteredIssues = useMemo(() => {
    let result = issues;
    
    // Filter by building if provided
    if (buildingId) {
      result = result.filter(issue => issue.building_id === buildingId);
    }
    
    // Filter by status if provided
    if (filter === 'active') {
      result = result.filter(issue => issue.status !== 'resolved');
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(issue => 
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.rooms?.name?.toLowerCase().includes(query) ||
        issue.rooms?.room_number?.toLowerCase().includes(query) ||
        `${issue.reporter?.first_name} ${issue.reporter?.last_name}`.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [issues, searchQuery, buildingId, filter]);

  // Group issues based on grouping mode
  const groupedIssues = useMemo(() => {
    const groups: Record<string, EnhancedIssue[]> = {};
    
    filteredIssues.forEach(issue => {
      let groupKey = '';
      
      switch (groupingMode) {
        case 'priority':
          groupKey = issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1);
          break;
        case 'room':
          groupKey = issue.rooms?.room_number || 'Unassigned Room';
          break;
        case 'date':
          groupKey = new Date(issue.created_at).toLocaleDateString();
          break;
        case 'reporter':
          groupKey = issue.reporter ? 
            `${issue.reporter.first_name} ${issue.reporter.last_name}` : 
            'Unknown Reporter';
          break;
        case 'status':
          groupKey = issue.status.replace('_', ' ').charAt(0).toUpperCase() + 
                    issue.status.replace('_', ' ').slice(1);
          break;
        default:
          groupKey = 'All Issues';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(issue);
    });

    // Sort groups by priority/relevance
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      if (groupingMode === 'priority') {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return (priorityOrder[a as keyof typeof priorityOrder] || 999) - 
               (priorityOrder[b as keyof typeof priorityOrder] || 999);
      }
      return a.localeCompare(b);
    });

    return sortedGroupKeys.reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return acc;
    }, {} as Record<string, EnhancedIssue[]>);
  }, [filteredIssues, groupingMode]);

  const handleIssueSelect = (issueId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedIssues, issueId]);
    } else {
      onSelectionChange(selectedIssues.filter(id => id !== issueId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredIssues.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {searchQuery ? 'No issues match your search.' : 'No issues found.'}
      </div>
    );
  }

  // Render based on view mode
  if (viewMode === 'table') {
    return (
      <IssueTableView
        issues={filteredIssues}
        selectedIssues={selectedIssues}
        onSelectionChange={onSelectionChange}
        onIssueUpdate={onIssueUpdate}
      />
    );
  }

  if (viewMode === 'timeline') {
    return (
      <IssueTimelineView
        issues={filteredIssues}
        onIssueUpdate={onIssueUpdate}
      />
    );
  }

  // Default cards view with grouping
  return (
    <div className="space-y-6">
      {Object.entries(groupedIssues).map(([groupName, groupIssues]) => (
        <div key={groupName}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {groupName}
            <span className="text-sm text-muted-foreground font-normal">
              ({groupIssues.length})
            </span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupIssues.map(issue => (
              <EnhancedIssueCard
                key={issue.id}
                issue={issue}
                isSelected={selectedIssues.includes(issue.id)}
                onSelect={(selected) => handleIssueSelect(issue.id, selected)}
                onUpdate={onIssueUpdate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}