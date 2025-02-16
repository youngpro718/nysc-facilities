
import { LightingFixture } from "@/components/lighting/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CardBackProps {
  fixture: LightingFixture;
}

export const CardBack = ({ fixture }: CardBackProps) => {
  return (
    <Card className="absolute w-full h-full backface-hidden rotate-y-180">
      <CardHeader className="flex-none">
        <CardTitle className="text-lg font-bold">Maintenance History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[220px] pr-4">
          <div className="space-y-4">
            {/* Ballast Status Section */}
            <div className="space-y-2">
              <h3 className="font-semibold">Ballast Status</h3>
              <div className="flex items-center gap-2">
                <Badge variant={fixture.ballast_issue ? "destructive" : "secondary"}>
                  {fixture.ballast_issue ? "Issue Detected" : "Normal"}
                </Badge>
                {fixture.ballast_check_notes && (
                  <p className="text-sm text-muted-foreground">
                    {fixture.ballast_check_notes}
                  </p>
                )}
              </div>
            </div>

            {/* Maintenance History Section */}
            <div className="space-y-2">
              <h3 className="font-semibold">Maintenance Records</h3>
              {fixture.maintenance_history && fixture.maintenance_history.length > 0 ? (
                <div className="space-y-2">
                  {fixture.maintenance_history.map((record, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                      <p className="font-medium">{record.type}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(record.date), 'PPp')}
                      </p>
                      {record.notes && (
                        <p className="text-muted-foreground mt-1">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No maintenance records found</p>
              )}
            </div>

            {/* Inspection History Section */}
            <div className="space-y-2">
              <h3 className="font-semibold">Inspection History</h3>
              {fixture.inspection_history && fixture.inspection_history.length > 0 ? (
                <div className="space-y-2">
                  {fixture.inspection_history.map((inspection, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                      <p className="font-medium">
                        {inspection.status}
                      </p>
                      <p className="text-muted-foreground">
                        {format(new Date(inspection.date), 'PPp')}
                      </p>
                      {inspection.notes && (
                        <p className="text-muted-foreground mt-1">{inspection.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No inspection records found</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
