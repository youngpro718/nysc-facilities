import { EnhancedCourtAssignmentTable } from "./EnhancedCourtAssignmentTable";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const AssignmentManagementPanel = () => {
  const { getCourtImpactSummary } = useCourtIssuesIntegration();
  const impactSummary = getCourtImpactSummary();

  return (
    <div className="space-y-6">
      {/* Header with Impact Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignment Management</h2>
          <p className="text-muted-foreground">
            Manage court assignments with dropdown personnel selection and real-time issue monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {impactSummary && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {impactSummary.totalAffectedRooms} Affected
              </Badge>
              {impactSummary.urgentIssues > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {impactSummary.urgentIssues} Urgent
                </Badge>
              )}
            </div>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courtrooms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">33</div>
            <p className="text-xs text-muted-foreground">All courtrooms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">33</div>
            <p className="text-xs text-muted-foreground">With assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Unassigned rooms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {impactSummary?.totalAffectedRooms || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Rooms with issues
              {impactSummary?.urgentIssues ? ` (${impactSummary.urgentIssues} urgent)` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Assignment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Court Assignments</CardTitle>
          <CardDescription>
            Click on any cell to edit. Use dropdowns to select personnel from the database.
            Rooms with issues are highlighted and show warning icons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedCourtAssignmentTable />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Personnel Selection:</strong> Click on Justice, Clerks, or Sergeant fields to open dropdown menus with available personnel from the database.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Real-time Integration:</strong> Rooms with issues are automatically highlighted. Urgent issues show red backgrounds, regular issues show yellow.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Drag & Drop:</strong> Use the grip handle to reorder assignments. Changes are saved automatically.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Notifications:</strong> You'll receive alerts when new issues affect assigned courtrooms.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};