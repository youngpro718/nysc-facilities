
import { Badge } from "@/components/ui/badge";
import { StatusEnum } from "./rooms/types/roomEnums";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = status === StatusEnum.ACTIVE ? 'default' : 'destructive';
  
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
