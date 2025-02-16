
import { Briefcase, UserCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmploymentSectionProps {
  department: string | null;
  title: string | null;
  status: string | null;
}

export function EmploymentSection({ department, title, status }: EmploymentSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Employment Details</h3>
      <div className="space-y-2">
        {department && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span>{department}</span>
          </div>
        )}
        {title && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCircle className="h-4 w-4 flex-shrink-0" />
            <span>{title}</span>
          </div>
        )}
        {status && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
