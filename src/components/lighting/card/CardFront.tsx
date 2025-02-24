import { LightingFixture } from "@/components/lighting/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Lightbulb, RotateCw } from "lucide-react";
import { EditLightingDialog } from "@/components/lighting/EditLightingDialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: (e?: React.MouseEvent) => void;
  onFixtureUpdated: () => void;
  onFlip: () => void;
}

export function CardFront({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete,
  onFixtureUpdated,
  onFlip
}: CardFrontProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional':
        return 'bg-green-100 text-green-800';
      case 'maintenance_needed':
        return 'bg-yellow-100 text-yellow-800';
      case 'non_functional':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="absolute w-full h-full bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
              />
              <h3 className="font-medium">{fixture.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(fixture.status)}>
                {fixture.status.replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline">
                {fixture.type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
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
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>{fixture.bulb_count} {fixture.technology || 'Standard'} {fixture.bulb_count === 1 ? 'Bulb' : 'Bulbs'}</span>
          </div>
          <p className="text-muted-foreground">
            {fixture.building_name} - {fixture.floor_name}
            {fixture.room_number && ` (Room ${fixture.room_number})`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
