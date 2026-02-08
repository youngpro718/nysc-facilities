/**
 * Issues Tab Component
 * Full issues management interface with filtering, search, and list views
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw
} from "lucide-react";
import { EnhancedIssuesList } from "@/components/admin-issues/EnhancedIssuesList";
import { IssueGroupingControls } from "@/components/admin-issues/IssueGroupingControls";
import type { GroupingMode, ViewMode, StatusFilter, PriorityFilter } from "@/types/issues";

interface IssuesTabProps {
  allIssues: unknown[];
  enhancedMetrics: {
    activeIssues: number;
    criticalCount: number;
    inProgress: number;
    resolvedToday: number;
  };
  isLoading: boolean;
  // Filter state
  groupingMode: GroupingMode;
  viewMode: ViewMode;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  searchInput: string;
  searchQuery: string;
  selectedIssues: string[];
  // Filter handlers
  onGroupingChange: (mode: GroupingMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onPriorityFilterChange: (filter: PriorityFilter) => void;
  onSearchChange: (query: string) => void;
  onSelectionChange: (ids: string[]) => void;
  // Actions
  onCreateIssue: () => void;
  onRefresh: () => void;
  // Optional filters
  buildingId?: string | null;
  filter?: string | null;
  roomId?: string | null;
}

export function IssuesTab({
  allIssues,
  enhancedMetrics,
  isLoading,
  groupingMode,
  viewMode,
  statusFilter,
  priorityFilter,
  searchInput,
  searchQuery,
  selectedIssues,
  onGroupingChange,
  onViewModeChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSearchChange,
  onSelectionChange,
  onCreateIssue,
  onRefresh,
  buildingId,
  filter,
  roomId,
}: IssuesTabProps) {
  const clearFilters = () => {
    onStatusFilterChange('all');
    onPriorityFilterChange('all');
    onGroupingChange('priority');
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      {/* Issues Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Issues Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Track, manage, and resolve facility issues efficiently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={onCreateIssue} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Quick Stats for Issues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{enhancedMetrics.criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{enhancedMetrics.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Issues</p>
                <p className="text-2xl font-bold text-blue-600">{enhancedMetrics.activeIssues}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{enhancedMetrics.resolvedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Controls */}
      <IssueGroupingControls
        groupingMode={groupingMode}
        viewMode={viewMode}
        onGroupingChange={onGroupingChange}
        onViewModeChange={onViewModeChange}
        searchQuery={searchInput}
        onSearchChange={onSearchChange}
        totalIssues={allIssues?.length || 0}
        selectedCount={selectedIssues.length}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onStatusFilterChange={onStatusFilterChange}
        onPriorityFilterChange={onPriorityFilterChange}
      />

      {/* Quick filter presets */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={statusFilter === 'open' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onStatusFilterChange('open')}
        >
          Open
        </Button>
        <Button 
          variant={priorityFilter === 'high' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onPriorityFilterChange('high')}
        >
          High Priority
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters}
        >
          Clear
        </Button>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                All Issues ({allIssues?.length || 0})
              </CardTitle>
              <CardDescription>
                Complete list of facility issues with detailed information and management options
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <EnhancedIssuesList 
            issues={allIssues || []}
            viewMode={viewMode}
            groupingMode={groupingMode}
            searchQuery={searchQuery}
            selectedIssues={selectedIssues}
            onSelectionChange={onSelectionChange}
            onIssueUpdate={onRefresh}
            isLoading={isLoading}
            buildingId={buildingId}
            filter={filter}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            roomId={roomId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
