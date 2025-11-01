import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Timer, User } from "lucide-react";
import { IssueFiltersType } from "../types/FilterTypes";

interface QuickFiltersProps {
  onFilterChange: (filters: Partial<IssueFiltersType>) => void;
}

const defaultFilters: IssueFiltersType = {
  type: 'all_types',
  status: 'all_statuses',
  priority: 'all_priorities',
  assigned_to: 'all_assignments',
  lightingType: 'all_lighting_types',
  fixtureStatus: 'all_fixture_statuses',
  electricalIssue: 'all_electrical_issues'
};

export const QuickFilters = ({ onFilterChange }: QuickFiltersProps) => {
  const applyQuickFilter = (filter: Partial<IssueFiltersType>) => {
    // Reset all filters to default and then apply the new filter
    onFilterChange({
      ...defaultFilters,
      ...filter
    });
  };

  const quickFilters = [
    {
      label: "Critical",
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: () => applyQuickFilter({ priority: "high" })
    },
    {
      label: "Overdue",
      icon: <Clock className="h-4 w-4" />,
      onClick: () => applyQuickFilter({ hasOverdue: true })
    },
    {
      label: "Recent",
      icon: <Timer className="h-4 w-4" />,
      onClick: () => applyQuickFilter({
        type: "all_types",
        sortBy: "created_at",
        order: "desc"
      })
    },
    {
      label: "My Issues",
      icon: <User className="h-4 w-4" />,
      onClick: () => applyQuickFilter({ assignedToMe: true })
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {quickFilters.map((filter) => (
        <Button
          key={filter.label}
          variant="secondary"
          size="sm"
          onClick={filter.onClick}
          className="flex items-center gap-2"
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

