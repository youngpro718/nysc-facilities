
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: {
      label: "Active",
      variant: "default"
    },
    inactive: {
      label: "Inactive",
      variant: "secondary"
    },
    under_maintenance: {
      label: "Maintenance",
      variant: "destructive"
    }
  };

  const config = statusConfig[status] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '), 
    variant: "outline" 
  };

  return (
    <Badge 
      variant={config.variant} 
      className={cn("mt-1", className)}
    >
      {config.label}
    </Badge>
  );
}
