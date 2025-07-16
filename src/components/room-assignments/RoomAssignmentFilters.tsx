import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoomAssignmentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  assignmentTypeFilter: string;
  onAssignmentTypeChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function RoomAssignmentFilters({
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  assignmentTypeFilter,
  onAssignmentTypeChange,
  statusFilter,
  onStatusChange,
}: RoomAssignmentFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 xl:gap-6">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search occupants, rooms..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select value={departmentFilter} onValueChange={onDepartmentChange}>
          <SelectTrigger>
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All departments</SelectItem>
            <SelectItem value="Administration">Administration</SelectItem>
            <SelectItem value="Security">Security</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="IT">IT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-type">Assignment Type</Label>
        <Select value={assignmentTypeFilter} onValueChange={onAssignmentTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="primary_office">Primary Office</SelectItem>
            <SelectItem value="secondary_office">Secondary Office</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="shared_workspace">Shared Workspace</SelectItem>
            <SelectItem value="temporary">Temporary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}