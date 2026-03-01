import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConflictDetectionService, Conflict, Warning } from "@/services/court/conflictDetectionService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  XCircle,
  Users,
  FileText,
  Info
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ConflictDetectionPanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: detectionResult, isLoading, refetch } = useQuery({
    queryKey: ["conflict-detection"],
    queryFn: () => ConflictDetectionService.detectConflicts(),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case "double_booked_judge":
        return <Users className="h-4 w-4" />;
      case "duplicate_part":
        return <FileText className="h-4 w-4" />;
      case "missing_required_staff":
        return <Users className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = detectionResult && (detectionResult.hasConflicts || detectionResult.warnings.length > 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {hasIssues ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                Assignment Conflict Detection
              </CardTitle>
              <CardDescription>
                Automatically detect scheduling conflicts and validation issues
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasIssues ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">No Conflicts Detected</AlertTitle>
              <AlertDescription>
                All court assignments are valid with no scheduling conflicts or missing required staff.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Critical Conflicts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {detectionResult?.summary.criticalConflicts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Total Conflicts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">
                    {detectionResult?.summary.totalConflicts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All severity levels
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {detectionResult?.summary.warnings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incomplete assignments
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflicts List - grouped by type, sorted by severity */}
      {detectionResult && detectionResult.conflicts.length > 0 && (() => {
        // Group conflicts by type
        const grouped = new Map<string, typeof detectionResult.conflicts>();
        const typeLabels: Record<string, string> = {
          double_booked_judge: "Double-Booked Judges",
          duplicate_part: "Duplicate Part Numbers",
          missing_required_staff: "Missing Required Staff",
          invalid_assignment: "Invalid Assignments",
        };
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        
        // Sort all conflicts by severity first
        const sorted = [...detectionResult.conflicts].sort(
          (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
        );
        
        sorted.forEach(c => {
          if (!grouped.has(c.type)) grouped.set(c.type, []);
          grouped.get(c.type)!.push(c);
        });

        // Sort groups: put groups with critical items first
        const sortedGroups = [...grouped.entries()].sort(([, a], [, b]) => {
          const aMin = Math.min(...a.map(c => severityOrder[c.severity] ?? 3));
          const bMin = Math.min(...b.map(c => severityOrder[c.severity] ?? 3));
          return aMin - bMin;
        });

        return sortedGroups.map(([type, conflicts]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {getConflictIcon(type)}
                {typeLabels[type] || type}
                <Badge variant={conflicts.some(c => c.severity === 'critical') ? 'destructive' : 'default'} className="ml-auto">
                  {conflicts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {conflicts.map((conflict, index) => (
                  <AccordionItem key={conflict.id} value={`conflict-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                        <Badge variant={getSeverityColor(conflict.severity)} className="flex items-center gap-1">
                          {getSeverityIcon(conflict.severity)}
                          {conflict.severity}
                        </Badge>
                        <span className="font-medium text-sm">{conflict.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <p className="text-sm text-muted-foreground">{conflict.description}</p>

                        {conflict.affectedRooms.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Affected Rooms:</p>
                            <div className="flex flex-wrap gap-2">
                              {conflict.affectedRooms.map(room => (
                                <Badge key={room} variant="outline">{room}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {conflict.affectedPersonnel.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Affected Personnel:</p>
                            <div className="flex flex-wrap gap-2">
                              {conflict.affectedPersonnel.map(person => (
                                <Badge key={person} variant="secondary">{person}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Suggested Action</AlertTitle>
                          <AlertDescription>{conflict.suggestedAction}</AlertDescription>
                        </Alert>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ));
      })()}

      {/* Warnings List - sorted by severity */}
      {detectionResult && detectionResult.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
            <CardDescription>
              {detectionResult.warnings.length} warning{detectionResult.warnings.length !== 1 ? "s" : ""} about incomplete assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...detectionResult.warnings]
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return (order[a.severity || 'low'] ?? 3) - (order[b.severity || 'low'] ?? 3);
                })
                .map((warning) => (
                <Alert key={warning.id} variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {warning.title}
                    {warning.severity && (
                      <Badge variant="outline" className="text-[10px]">{warning.severity}</Badge>
                    )}
                  </AlertTitle>
                  <AlertDescription>
                    {warning.description}
                    {warning.affectedRooms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {warning.affectedRooms.map(room => (
                          <Badge key={room} variant="outline" className="text-xs">
                            {room}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
