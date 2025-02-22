
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Timer, User } from "lucide-react";
import { useIssueFilters } from "../hooks/useIssueFilters";
import { IssueFiltersType } from "../types/FilterTypes";

export const QuickFilters = () => {
  const { setFilters } = useIssueFilters();

  const handleFilterChange = (newFilters: Partial<IssueFiltersType>) => {
    setFilters(newFilters);
  };

  const quickFilters = [
    {
      label: "Critical",
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: () => handleFilterChange({ priority: "high" })
    },
    {
      label: "Overdue",
      icon: <Clock className="h-4 w-4" />,
      onClick: () => handleFilterChange({ status: "open" })
    },
    {
      label: "Recent",
      icon: <Timer className="h-4 w-4" />,
      onClick: () => handleFilterChange({ type: "all_types" })
    },
    {
      label: "My Issues",
      icon: <User className="h-4 w-4" />,
      onClick: () => handleFilterChange({ assigned_to: "Self" })
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

