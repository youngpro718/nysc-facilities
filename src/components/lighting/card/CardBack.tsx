
import { LightingFixture } from "@/components/lighting/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CardBackProps {
  fixture: LightingFixture;
  onFlip: () => void;
}

export const CardBack = ({ fixture, onFlip }: CardBackProps) => {
  return (
    <Card 
      className="absolute w-full h-full cursor-pointer backface-hidden rotate-y-180"
      onClick={onFlip}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Maintenance History</CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
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
                  {fixture.maintenance_history.map((record: any, index: number) => (
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
                  {fixture.inspection_history.map((inspection: any, index: number) => (
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
};
