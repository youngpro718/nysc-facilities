import { LightingFixture } from "@/components/lighting/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { AlertTriangle, Zap, RotateCcw } from "lucide-react";

interface CardBackProps {
  fixture: LightingFixture;
  onFlip: (e?: React.MouseEvent) => void;
}

export const CardBack = ({ fixture, onFlip }: CardBackProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'functional':
        return <Badge className="bg-green-100 text-green-800">Functional</Badge>;
      case 'maintenance_needed':
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Maintenance</Badge>;
      case 'non_functional':
        return <Badge className="bg-red-100 text-red-800">Non-functional</Badge>;
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <Card className="w-full h-full bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Fixture History</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onFlip(e);
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {/* Current Issues Section */}
            {(fixture.electrical_issues?.short_circuit || 
              fixture.electrical_issues?.wiring_issues || 
              fixture.electrical_issues?.voltage_problems || 
              fixture.ballast_issue) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Current Issues
                </h4>
                <div className="space-y-1">
                  {Object.entries(fixture.electrical_issues || {}).map(([issue, hasIssue]) => 
                    hasIssue && (
                      <div key={issue} className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">{issue.replace(/_/g, ' ')}</span>
                      </div>
                    )
                  )}
                  {fixture.ballast_issue && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm">Ballast issue</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Maintenance History Section */}
            {fixture.maintenance_records && fixture.maintenance_records.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Maintenance History</h4>
                <div className="space-y-2">
                  {fixture.maintenance_records.map((record, index) => (
                    <div key={index} className="text-sm space-y-1 border rounded-md p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{record.type}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="text-muted-foreground">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspection History Section */}
            {fixture.inspection_records && fixture.inspection_records.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Inspection History</h4>
                <div className="space-y-2">
                  {fixture.inspection_records.map((record, index) => (
                    <div key={index} className="text-sm space-y-1 border rounded-md p-2">
                      <div className="flex justify-between items-center">
                        {getStatusBadge(record.status)}
                        <span className="text-muted-foreground">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="text-muted-foreground">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
