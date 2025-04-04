
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SpaceListFiltersProps {
  selectedStatus: string;
  onStatusChange: (value: string) => void;
}

export function SpaceListFilters({ selectedStatus, onStatusChange }: SpaceListFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
