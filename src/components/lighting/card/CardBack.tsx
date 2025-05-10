
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LightingFixture } from "@/components/lighting/types";
import { RotateCw, Clock, AlertCircle, Battery, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardBackProps {
  fixture: LightingFixture;
  onFlip: () => void;
}

export function CardBack({ fixture, onFlip }: CardBackProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };
  
  const hasElectricalIssues = () => {
    if (!fixture.electrical_issues) return false;
    return Object.values(fixture.electrical_issues).some(value => value === true);
  };
  
  const formatMaintenanceHistory = (history: any[] | null | undefined) => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 3).map((item) => ({
      date: item.date ? formatDate(item.date) : "Unknown date",
      type: item.type || "General maintenance",
      notes: item.notes || "No notes"
    }));
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onFlip}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pt-10 pb-2">
        <h3 className="font-medium">Fixture Details</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Maintenance Schedule
          </h4>
          
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <div className="text-muted-foreground">Last Maintenance</div>
            <div>{formatDate(fixture.last_maintenance_date)}</div>
            
            <div className="text-muted-foreground">Next Maintenance</div>
            <div>{formatDate(fixture.next_maintenance_date)}</div>
            
            <div className="text-muted-foreground">Installation</div>
            <div>{formatDate(fixture.installation_date)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Electrical Status
          </h4>
          
          {hasElectricalIssues() ? (
            <div className="space-y-1">
              {fixture.electrical_issues?.short_circuit && (
                <Badge variant="destructive" className="mr-1">Short Circuit</Badge>
              )}
              {fixture.electrical_issues?.wiring_issues && (
                <Badge variant="destructive" className="mr-1">Wiring Issues</Badge>
              )}
              {fixture.electrical_issues?.voltage_problems && (
                <Badge variant="destructive" className="mr-1">Voltage Problems</Badge>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700">No Electrical Issues</Badge>
          )}
          
          {fixture.ballast_issue && (
            <div className="mt-2">
              <Badge variant="destructive" className="mb-1">Ballast Issue</Badge>
              {fixture.ballast_check_notes && (
                <p className="text-xs text-muted-foreground">{fixture.ballast_check_notes}</p>
              )}
            </div>
          )}
        </div>
        
        {fixture.maintenance_history && fixture.maintenance_history.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Recent Maintenance
            </h4>
            
            <div className="space-y-2">
              {formatMaintenanceHistory(fixture.maintenance_history).map((item, idx) => (
                <div key={idx} className="bg-muted p-2 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.type}</span>
                    <span>{item.date}</span>
                  </div>
                  {item.notes && <p className="text-muted-foreground mt-1">{item.notes}</p>}
                </div>
              ))}
            </div>
            
            {fixture.maintenance_history?.length > 3 && (
              <p className="text-xs text-muted-foreground">
                + {fixture.maintenance_history.length - 3} more records
              </p>
            )}
          </div>
        )}
        
        {fixture.maintenance_notes && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Additional Notes</h4>
            <p className="text-xs text-muted-foreground">{fixture.maintenance_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
