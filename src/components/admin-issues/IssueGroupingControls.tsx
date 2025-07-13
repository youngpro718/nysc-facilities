import { Search, Filter, Grid, List, Zap, Users, Calendar, AlertTriangle, MapPin, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { GroupingMode, ViewMode } from "@/pages/AdminIssuesHub";

interface IssueGroupingControlsProps {
  groupingMode: GroupingMode;
  viewMode: ViewMode;
  onGroupingChange: (mode: GroupingMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalIssues: number;
  selectedCount: number;
}

export function IssueGroupingControls({
  groupingMode,
  viewMode,
  onGroupingChange,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  totalIssues,
  selectedCount
}: IssueGroupingControlsProps) {
  const groupingOptions = [
    { value: 'priority', label: 'Priority', icon: AlertTriangle },
    { value: 'room', label: 'Room', icon: MapPin },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'reporter', label: 'Reporter', icon: Users },
    { value: 'status', label: 'Status', icon: CheckSquare },
  ] as const;

  const viewOptions = [
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
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
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