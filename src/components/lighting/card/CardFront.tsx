
import { LightingFixture } from "@/components/lighting/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, AlertTriangle, Zap } from "lucide-react";
import { EditLightingDialog } from "@/components/lighting/EditLightingDialog";
import { LightingMaintenanceDialog } from "@/components/spaces/lighting/LightingMaintenanceDialog";
import { cn } from "@/lib/utils";

interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onFixtureUpdated: () => void;
}

export function CardFront({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete,
  onFixtureUpdated 
}: CardFrontProps) {
  const statusColor = {
    functional: "bg-green-500",
    maintenance_needed: "bg-yellow-500",
    non_functional: "bg-red-500",
    pending_maintenance: "bg-blue-500",
    scheduled_replacement: "bg-purple-500"
  };

  return (
    <Card className="absolute w-full h-full backface-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium text-sm">{fixture.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{fixture.type}</Badge>
              <Badge className={statusColor[fixture.status]}>
                {fixture.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>

        <div className="mt-4 space-y-2">
          {fixture.electrical_issues && (
            Object.entries(fixture.electrical_issues).map(([key, value]) => (
              value && (
                <div key={key} className="flex items-center gap-2 text-red-600 text-sm">
                  <Zap className="h-4 w-4" />
                  <span>{key.replace(/_/g, ' ')}</span>
                </div>
              )
            ))
          )}

          {fixture.ballast_issue && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Ballast Issue</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <EditLightingDialog 
            fixture={fixture} 
            onFixtureUpdated={onFixtureUpdated}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <LightingMaintenanceDialog
            fixtureId={fixture.id}
            fixtureName={fixture.name}
            onMaintenanceScheduled={onFixtureUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
}
