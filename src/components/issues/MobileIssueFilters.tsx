import { useState } from "react";
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { IssueFiltersType } from "./types/FilterTypes";

interface MobileIssueFiltersProps {
  filters: IssueFiltersType;
  onFiltersChange: (filters: IssueFiltersType) => void;
}

export function MobileIssueFilters({
  filters,
  onFiltersChange
}: MobileIssueFiltersProps) {
  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const assignmentOptions = [
    { value: 'DCAS', label: 'DCAS' },
    { value: 'OCA', label: 'OCA' },
    { value: 'Self', label: 'Self' },
    { value: 'Outside_Vendor', label: 'Outside Vendor' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' }
  ];

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, status: status as IssueFiltersType['status'] });
    } else {
      onFiltersChange({ ...filters, status: 'all_statuses' });
    }
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, priority: priority as IssueFiltersType['priority'] });
    } else {
      onFiltersChange({ ...filters, priority: 'all_priorities' });
    }
  };

  const handleAssignmentChange = (assignment: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, assigned_to: assignment as IssueFiltersType['assigned_to'] });
    } else {
      onFiltersChange({ ...filters, assigned_to: 'all_assignments' });
    }
  };

  const isStatusChecked = (status: string) => {
    if (!filters.status || filters.status === 'all_statuses') return false;
    if (Array.isArray(filters.status)) {
      return filters.status.includes(status as any);
    }
    return filters.status === status;
  };

  const isPriorityChecked = (priority: string) => {
    return filters.priority === priority;
  };

  const isAssignmentChecked = (assignment: string) => {
    return filters.assigned_to === assignment;
  };

  const getActiveFilters = () => {
    const active = [];
    
    if (filters.status && filters.status !== 'all_statuses') {
      const statusValue = Array.isArray(filters.status) ? filters.status[0] : filters.status;
      const option = statusOptions.find(o => o.value === statusValue);
      if (option) active.push({ id: `status-${statusValue}`, label: 'Status', value: option.label });
    }
    
    if (filters.priority && filters.priority !== 'all_priorities') {
      const option = priorityOptions.find(o => o.value === filters.priority);
      if (option) active.push({ id: `priority-${filters.priority}`, label: 'Priority', value: option.label });
    }
    
    if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
      const option = assignmentOptions.find(o => o.value === filters.assigned_to);
      if (option) active.push({ id: `assigned_to-${filters.assigned_to}`, label: 'Assigned To', value: option.label });
    }
    
    if (filters.assignedToMe) {
      active.push({ id: 'assignedToMe', label: 'Assigned To Me', value: 'Yes' });
    }
    
    return active;
  };

  const clearFilter = (filterId: string) => {
    const [type] = filterId.split('-');
    
    switch (type) {
      case 'status':
        onFiltersChange({ ...filters, status: 'all_statuses' });
        break;
      case 'priority':
        onFiltersChange({ ...filters, priority: 'all_priorities' });
        break;
      case 'assigned_to':
        onFiltersChange({ ...filters, assigned_to: 'all_assignments' });
        break;
      case 'assignedToMe':
        onFiltersChange({ ...filters, assignedToMe: false });
        break;
    }
  };

  const clearAll = () => {
    onFiltersChange({
      type: 'all_types',
      status: 'all_statuses',
      priority: 'all_priorities',
      assigned_to: 'all_assignments',
      sortBy: 'created_at',
      order: 'desc',
      assignedToMe: false
    });
  };

  const activeFilters = getActiveFilters();

  return (
    <MobileFilterSheet
      title="Filter Issues"
      description="Filter and sort issues by various criteria"
      activeFilters={activeFilters}
      onClearFilter={clearFilter}
      onClearAll={clearAll}
      filterCount={activeFilters.length}
    >
      {/* Quick Filter Presets */}
      <div>
        <Label className="text-sm font-medium">Quick Filters</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'open' })}
          >
            Open Issues
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, assignedToMe: true })}
          >
            My Issues
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, priority: 'high' })}
          >
            High Priority
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Status Filter */}
      <div>
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-3 mt-2">
          {statusOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={isStatusChecked(option.value)}
                onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`status-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Priority Filter */}
      <div>
        <Label className="text-sm font-medium">Priority</Label>
        <div className="space-y-3 mt-2">
          {priorityOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`priority-${option.value}`}
                checked={isPriorityChecked(option.value)}
                onCheckedChange={(checked) => handlePriorityChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`priority-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Assignment Filter */}
      <div>
        <Label className="text-sm font-medium">Assigned To</Label>
        <div className="space-y-3 mt-2">
          {assignmentOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`assignment-${option.value}`}
                checked={isAssignmentChecked(option.value)}
                onCheckedChange={(checked) => handleAssignmentChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`assignment-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort Options */}
      <div>
        <Label className="text-sm font-medium">Sort By</Label>
        <div className="space-y-3 mt-2">
          <Select 
            value={filters.sortBy || 'created_at'} 
            onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.order || 'desc'} 
            onValueChange={(value: 'asc' | 'desc') => onFiltersChange({ ...filters, order: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </MobileFilterSheet>
  );
}