
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "./hooks/types";

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<RequestStatus, 'default' | 'success' | 'destructive'> = {
    pending: 'default',
    approved: 'success',
    rejected: 'destructive'
  };

  const labels: Record<RequestStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
