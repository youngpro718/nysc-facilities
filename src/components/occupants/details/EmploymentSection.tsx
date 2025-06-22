
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { OccupantQueryResponse } from "../types/occupantTypes";

interface EmploymentSectionProps {
  occupantData: OccupantQueryResponse;
}

export function EmploymentSection({ occupantData }: EmploymentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Employment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Title</p>
          <p className="text-sm text-muted-foreground">{occupantData.title || "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Department</p>
          <p className="text-sm text-muted-foreground">{occupantData.department || "—"}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <Badge variant={occupantData.status === 'active' ? 'default' : 'secondary'}>
            {occupantData.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
