// @ts-nocheck
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LightingFixture } from "@/types/lighting";
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
  
  const formatMaintenanceHistory = (history: unknown[] | null | undefined) => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 3).map((item) => ({
      date: item.date ? formatDate(item.date) : "Unknown date",
      type: item.type || "General maintenance",
      notes: item.notes || "No notes"
    }));
  };

  return (
    <Card className="w-full h-[280px] rounded-xl border bg-card shadow-sm relative overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-10 rounded-md hover:bg-muted/60 bg-background/90 backdrop-blur-sm border border-border/50"
        onClick={onFlip}
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <CardHeader className="pt-12 pb-3">
        <h3 className="font-semibold text-lg">Fixture Details</h3>
        <p className="text-sm text-muted-foreground">{fixture.name}</p>
      </CardHeader>

      <CardContent className="px-4 space-y-4 pb-4 h-full overflow-y-auto">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Location</span>
            <p className="font-medium">{fixture.space_name || fixture.room_number || 'Unassigned'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Type</span>
            <p className="font-medium">{fixture.type || 'Standard'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Bulb Type</span>
            <p className="font-medium">{fixture.bulb_count} bulbs</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Technology</span>
            <p className="font-medium">{fixture.technology || 'LED'}</p>
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
            <Clock className="h-4 w-4" />
            Maintenance Schedule
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Maintenance</span>
              <span className="text-sm font-medium">{formatDate(fixture.last_maintenance_date)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Next Maintenance</span>
              <span className={cn("text-sm font-medium", 
                fixture.next_maintenance_date && new Date(fixture.next_maintenance_date) < new Date() 
                  ? "text-destructive" 
                  : "text-foreground"
              )}>
                {formatDate(fixture.next_maintenance_date)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Installation Date</span>
              <span className="text-sm font-medium">{formatDate(fixture.installation_date)}</span>
            </div>
          </div>
        </div>

        {/* Status & Issues */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
            <AlertCircle className="h-4 w-4" />
            Status & Issues
          </h4>
          
          <div className="space-y-2">
            {hasElectricalIssues() ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">Electrical Issues Detected:</p>
                <div className="flex flex-wrap gap-1">
                  {fixture.electrical_issues?.short_circuit && (
                    <Badge variant="destructive" className="text-xs">Short Circuit</Badge>
                  )}
                  {fixture.electrical_issues?.wiring_issues && (
                    <Badge variant="destructive" className="text-xs">Wiring Issues</Badge>
                  )}
                  {fixture.electrical_issues?.voltage_problems && (
                    <Badge variant="destructive" className="text-xs">Voltage Problems</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 dark:text-green-400">No Electrical Issues</span>
              </div>
            )}
            
            {fixture.ballast_issue && (
              <div className="mt-3 p-2 bg-destructive/10 rounded-md">
                <Badge variant="destructive" className="mb-1 text-xs">Ballast Issue</Badge>
                {fixture.ballast_check_notes && (
                  <p className="text-xs text-muted-foreground mt-1">{fixture.ballast_check_notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Maintenance History */}
        {fixture.maintenance_history && fixture.maintenance_history.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <CalendarClock className="h-4 w-4" />
              Recent Maintenance
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formatMaintenanceHistory(fixture.maintenance_history).map((item, idx) => (
                <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
            
            {fixture.maintenance_history?.length > 3 && (
              <p className="text-xs text-center text-muted-foreground">
                + {fixture.maintenance_history.length - 3} more maintenance records
              </p>
            )}
          </div>
        )}
        
        {/* Additional Notes */}
        {fixture.maintenance_notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold border-b pb-2">Additional Notes</h4>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">{fixture.maintenance_notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
