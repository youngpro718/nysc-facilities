import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, Wrench } from "lucide-react";

interface AssignmentTypeSelectionProps {
  assignmentType: string;
  onAssignmentTypeChange: (value: string) => void;
  isPrimaryAssignment: boolean;
  onPrimaryAssignmentChange: (value: boolean) => void;
}

const assignmentTypes = [
  {
    value: 'primary_office',
    label: 'Primary Office',
    description: 'Main workspace assigned to the occupant',
    icon: Building2,
    variant: 'default' as const
  },
  {
    value: 'work_location',
    label: 'Work Location',
    description: 'Secondary workspace or shared office',
    icon: Briefcase,
    variant: 'secondary' as const
  },
  {
    value: 'support_space',
    label: 'Support Space',
    description: 'Storage, meeting room, or utility space',
    icon: Wrench,
    variant: 'outline' as const
  }
];

export function AssignmentTypeSelection({
  assignmentType,
  onAssignmentTypeChange,
  isPrimaryAssignment,
  onPrimaryAssignmentChange
}: AssignmentTypeSelectionProps) {
  const selectedType = assignmentTypes.find(type => type.value === assignmentType);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="assignment-type">Assignment Type</Label>
        <Select value={assignmentType} onValueChange={onAssignmentTypeChange}>
          <SelectTrigger id="assignment-type">
            <SelectValue placeholder="Select assignment type">
              {selectedType && (
                <div className="flex items-center gap-2">
                  <selectedType.icon className="h-4 w-4" />
                  <span>{selectedType.label}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {assignmentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {assignmentType && (
        <div className="space-y-2">
          <Label htmlFor="primary-assignment">Primary Assignment</Label>
          <Select
            value={isPrimaryAssignment ? "yes" : "no"}
            onValueChange={(value: string) => onPrimaryAssignmentChange(value === "yes")}
          >
            <SelectTrigger id="primary-assignment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">Primary</Badge>
                  <span>Make this the primary assignment</span>
                </div>
              </SelectItem>
              <SelectItem value="no">Secondary assignment</SelectItem>
            </SelectContent>
          </Select>
          {isPrimaryAssignment && (
            <p className="text-xs text-muted-foreground">
              This will become the occupant's main {selectedType?.label.toLowerCase()} assignment. Any existing primary assignment of this type will be demoted to secondary.
            </p>
          )}
        </div>
      )}

      {assignmentType && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {selectedType?.description}
          </p>
        </div>
      )}
    </div>
  );
}