import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IssueTypeBadgeProps {
  issueType: string | null | undefined;
  className?: string;
}

export function IssueTypeBadge({ issueType, className }: IssueTypeBadgeProps) {
  if (!issueType || issueType === 'general') return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        className
      )}
    >
      {issueType.replace(/_/g, ' ').toUpperCase()}
    </Badge>
  );
}
