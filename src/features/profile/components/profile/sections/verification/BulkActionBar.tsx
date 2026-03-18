
import { Button } from "@/components/ui/button";
import { Building, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectedUser } from "./hooks/useVerificationState";

interface Department {
  id: string;
  name: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  departments: Department[] | undefined;
  selectedDepartment: string | null;
  onDepartmentChange: (id: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function BulkActionBar({
  selectedCount,
  departments,
  selectedDepartment,
  onDepartmentChange,
  onApprove,
  onReject,
}: BulkActionBarProps) {
  return (
    <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-sm font-medium block">
          {selectedCount} requests selected
        </span>
        <Select
          value={selectedDepartment || ''}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger className="w-[200px]">
            <Building className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments?.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onApprove}
          disabled={!selectedDepartment}
        >
          <Check className="h-4 w-4 mr-1" />
          Approve Selected
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
        >
          <X className="h-4 w-4 mr-1" />
          Reject Selected
        </Button>
      </div>
    </div>
  );
}
