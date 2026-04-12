// @ts-nocheck
/**
 * Issues Tab Component
 * Full issues management interface with filtering, search, and list views
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EnhancedIssuesList } from "@features/issues/components/admin-issues/EnhancedIssuesList";
import { IssueGroupingControls } from "@features/issues/components/admin-issues/IssueGroupingControls";
import type { GroupingMode, ViewMode, StatusFilter, PriorityFilter } from "@features/issues/types/issues";

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
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setIsBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('issues')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedIssues);

      if (error) throw error;

      toast.success(`${selectedIssues.length} issues marked as ${newStatus.replace('_', ' ')}.`);
      onSelectionChange([]);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update issues");
    } finally {
      setIsBulkUpdating(false);
    }
  };

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
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{enhancedMetrics.criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">In Progress</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{enhancedMetrics.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Issues</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{enhancedMetrics.activeIssues}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{enhancedMetrics.resolvedToday}</p>
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

      {/* Bulk Action Bar */}
      {selectedIssues.length > 0 && (
        <div className="sticky bottom-4 z-10 mx-auto w-fit">
          <div className="flex items-center gap-3 bg-background border shadow-lg rounded-full px-4 py-2">
            <span className="text-sm font-medium">{selectedIssues.length} selected</span>
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate('in_progress')}
              disabled={isBulkUpdating}
            >
              Mark In Progress
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate('resolved')}
              disabled={isBulkUpdating}
            >
              Mark Resolved
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectionChange([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
