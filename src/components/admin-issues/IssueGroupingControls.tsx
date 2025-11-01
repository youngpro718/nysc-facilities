import { Search, Filter, Grid, List, Zap, Users, Calendar, AlertTriangle, MapPin, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { GroupingMode, ViewMode, StatusFilter, PriorityFilter } from "@/types/issues";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface IssueGroupingControlsProps {
  groupingMode: GroupingMode;
  viewMode: ViewMode;
  onGroupingChange: (mode: GroupingMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalIssues: number;
  selectedCount: number;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
}

export function IssueGroupingControls({
  groupingMode,
  viewMode,
  onGroupingChange,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  totalIssues,
  selectedCount,
  statusFilter,
  priorityFilter,
  onStatusFilterChange,
  onPriorityFilterChange
}: IssueGroupingControlsProps) {
  const groupingOptions = [
    { value: 'priority', label: 'Priority', icon: AlertTriangle },
    { value: 'room', label: 'Room', icon: MapPin },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'reporter', label: 'Reporter', icon: Users },
    { value: 'status', label: 'Status', icon: CheckSquare },
  ] as const;

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    onStatusFilterChange('all');
    onPriorityFilterChange('all');
  };

  const viewOptions = [
    { value: 'board', label: 'Board', icon: Grid },
    { value: 'cards', label: 'Cards', icon: Grid },
    { value: 'table', label: 'Table', icon: List },
    { value: 'timeline', label: 'Timeline', icon: Zap },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues, rooms, reporters..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={(v) => onPriorityFilterChange(v as PriorityFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Group By */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Group by:</span>
            <Select value={groupingMode} onValueChange={onGroupingChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupingOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">View:</span>
            <div className="flex rounded-lg border p-1">
              {viewOptions.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={viewMode === option.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange(option.value)}
                    className="px-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} selected
            </Badge>
          )}
          <Badge variant="outline">
            {totalIssues} total issues
          </Badge>
        </div>
      </div>
    </div>
  );
}