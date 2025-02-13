
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface DashboardStatsProps {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
}

export function DashboardStats({ 
  totalIssues,
  openIssues,
  resolvedIssues,
  inProgressIssues
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Total Issues</h3>
        </div>
        <p className="text-2xl font-bold mt-2">{totalIssues}</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-medium">Open Issues</h3>
        </div>
        <p className="text-2xl font-bold mt-2">{openIssues}</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium">In Progress</h3>
        </div>
        <p className="text-2xl font-bold mt-2">{inProgressIssues}</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-medium">Resolved</h3>
        </div>
        <p className="text-2xl font-bold mt-2">{resolvedIssues}</p>
      </Card>
    </div>
  );
}
