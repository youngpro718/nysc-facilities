import { LightingFixture } from "@/components/lighting/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EditLightingDialog } from "../EditLightingDialog";
import { Trash2, AlertTriangle, Wrench, BatteryWarning, Zap, Scale, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onFlip: () => void;
  onFixtureUpdated: () => void;
}

const getMaintenanceInfo = (fixture: LightingFixture) => {
  const needsElectrician = fixture.maintenance_notes?.toLowerCase().includes('ballast') ||
                          fixture.maintenance_notes?.toLowerCase().includes('electrical') ||
                          (fixture.electrical_issues && (
                            fixture.electrical_issues.short_circuit ||
                            fixture.electrical_issues.wiring_issues ||
                            fixture.electrical_issues.voltage_problems
                          ));
  
  return {
    needsElectrician,
    isEmergency: fixture.type === 'emergency',
    isCritical: fixture.status === 'non_functional' || 
                (fixture.type === 'emergency' && fixture.status === 'maintenance_needed')
  };
};

const getStatusBadgeVariant = (status: string, isEmergency: boolean) => {
  if (status === 'maintenance_needed') return 'secondary';
  if (status === 'non_functional' || isEmergency) return 'destructive';
  return 'default';
};

export const CardFront = ({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete,
  onFlip,
  onFixtureUpdated 
}: CardFrontProps) => {
  const maintenanceInfo = getMaintenanceInfo(fixture);
  const hasElectricalIssues = fixture.electrical_issues && (
    fixture.electrical_issues.short_circuit ||
    fixture.electrical_issues.wiring_issues ||
    fixture.electrical_issues.voltage_problems
  );

  return (
    <Card 
      className={`absolute w-full h-full cursor-pointer backface-hidden ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onFlip}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              onSelect(checked as boolean);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <CardTitle className="text-lg font-bold">{fixture.name}</CardTitle>
        </div>
        <div className="flex space-x-2">
          <EditLightingDialog 
            fixture={fixture} 
            onFixtureUpdated={onFixtureUpdated}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={maintenanceInfo.isEmergency ? 'destructive' : 'default'}>
                {fixture.type}
              </Badge>
              <Badge 
                variant={getStatusBadgeVariant(fixture.status, maintenanceInfo.isEmergency)}
              >
                {fixture.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Technology: {fixture.technology || 'Not specified'}
              </span>
            </div>

            {(fixture.status === 'maintenance_needed' || fixture.status === 'non_functional' || hasElectricalIssues || fixture.ballast_issue) && (
              <div className="mt-2 space-y-2">
                {maintenanceInfo.needsElectrician && (
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <Wrench className="h-4 w-4" />
                    <span className="text-sm font-medium">Requires Electrician</span>
                  </div>
                )}

                {hasElectricalIssues && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Electrical Issues Detected</span>
                  </div>
                )}

                {fixture.ballast_issue && (
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
                    <Scale className="h-4 w-4" />
                    <span className="text-sm font-medium">Ballast Check Required</span>
                  </div>
                )}

                {maintenanceInfo.isEmergency && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                    <BatteryWarning className="h-4 w-4" />
                    <span className="text-sm font-medium">Emergency Light Maintenance Required</span>
                  </div>
                )}

                {(fixture.status === 'maintenance_needed' || fixture.status === 'non_functional') && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Maintenance Required</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Location:</span> {fixture.building_name} - {fixture.floor_name}
                {fixture.zone_name ? ` (${fixture.zone_name})` : ''}
              </p>
              {fixture.maintenance_notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold">Maintenance Notes:</span> {fixture.maintenance_notes}
                </p>
              )}
              {fixture.ballast_check_notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold">Ballast Check Notes:</span> {fixture.ballast_check_notes}
                </p>
              )}
            </div>
          </div>

          {fixture.emergency_circuit && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Emergency Circuit</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
