
import { LightingFixture } from "@/components/lighting/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BatteryMedium, Calendar, Check, DollarSign, Lightbulb, Settings, X } from "lucide-react";
import { RoomLightingDialog } from "./RoomLightingDialog";

interface RoomLightingConfigProps {
  roomId: string;
  className?: string;
  fixture?: LightingFixture;
}

export function RoomLightingConfig({ roomId, className, fixture }: RoomLightingConfigProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional':
        return 'bg-green-500';
      case 'maintenance_needed':
        return 'bg-yellow-500';
      case 'non_functional':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEmergencyBadgeColor = (isEmergency: boolean) => {
    return isEmergency ? 'bg-red-500' : 'bg-blue-500';
  };

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Lighting Configuration
          <RoomLightingDialog roomId={roomId} fixture={fixture} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fixture ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={getStatusColor(fixture.status)}>
                {fixture.status.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className={getEmergencyBadgeColor(fixture.type === 'emergency')}>
                {fixture.type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Lightbulb className="h-3 w-3" />
                {fixture.bulb_count}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Technology
                </p>
                <p className="text-sm text-muted-foreground">
                  {fixture.technology || 'Not specified'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <BatteryMedium className="h-4 w-4" />
                  Emergency Circuit
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {fixture.emergency_circuit ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </p>
              </div>

              {fixture.electrical_issues && Object.entries(fixture.electrical_issues).map(([key, value]) => (
                value && (
                  <div key={key} className="col-span-2">
                    <Badge variant="destructive">
                      {key.replace('_', ' ')}
                    </Badge>
                  </div>
                )
              ))}
            </div>

            {fixture.maintenance_notes && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Maintenance Notes
                </p>
                <p className="text-sm text-muted-foreground">
                  {fixture.maintenance_notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No lighting configuration found</p>
        )}
      </CardContent>
    </Card>
  );
}
