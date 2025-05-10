
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LightingFixture } from "@/components/lighting/types";
import { EditLightingDialog } from "../EditLightingDialog";
import { cn } from "@/lib/utils";
import { Lightbulb, RotateCw, Trash2, Calendar, Clock } from "lucide-react";

interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'functional':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance_needed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_functional':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'scheduled_replacement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'emergency':
        return <Badge variant="destructive" className="text-xs">Emergency</Badge>;
      case 'motion_sensor':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">Motion Sensor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Standard</Badge>;
    }
  };

  const formatMaintenanceDate = (date: string | null | undefined) => {
    if (!date) return "No date scheduled";
    const maintenanceDate = new Date(date);
    return maintenanceDate.toLocaleDateString();
  };

  const isMaintenanceSoon = () => {
    if (!fixture.next_maintenance_date) return false;
    const nextMaintenance = new Date(fixture.next_maintenance_date);
    const today = new Date();
    const daysUntilMaintenance = Math.floor((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0;
  };

  const getLocationText = () => {
    let locationParts = [];
    if (fixture.building_name) locationParts.push(fixture.building_name);
    if (fixture.floor_name) locationParts.push(`Floor ${fixture.floor_name}`);
    if (fixture.space_name) locationParts.push(fixture.space_name);
    if (fixture.room_number) locationParts.push(`#${fixture.room_number}`);
    
    return locationParts.join(' • ') || 'Location not assigned';
  };

  return (
    <Card className={cn(
      "w-full h-full overflow-hidden transition-all duration-200",
      isSelected && "ring-2 ring-primary"
    )}>
      <div className="absolute top-4 left-4 z-10">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </div>
      
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
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            {getTypeIcon(fixture.type)}
            <Badge className={cn("text-xs", getStatusColor(fixture.status))}>
              {fixture.status.replace('_', ' ')}
            </Badge>
          </div>
          <h3 className="font-medium truncate">{fixture.name}</h3>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Technology</div>
          <div className="font-medium">{fixture.technology || 'N/A'}</div>
          
          <div className="text-muted-foreground">Bulbs</div>
          <div className="font-medium flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            {fixture.bulb_count}
          </div>
          
          <div className="text-muted-foreground">Zone</div>
          <div className="font-medium">{fixture.zone_name || 'Unassigned'}</div>
          
          <div className="text-muted-foreground">Position</div>
          <div className="font-medium">{fixture.position || 'N/A'}</div>
        </div>

        <div className="text-xs text-muted-foreground truncate">
          {getLocationText()}
        </div>

        {fixture.next_maintenance_date && (
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            isMaintenanceSoon() ? "bg-yellow-50 text-yellow-800" : "bg-blue-50 text-blue-800"
          )}>
            <Calendar className="h-3 w-3" />
            <span>Maintenance: {formatMaintenanceDate(fixture.next_maintenance_date)}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confirm?</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onDelete}
              >
                Yes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <EditLightingDialog
                fixture={fixture}
                onFixtureUpdated={onFixtureUpdated}
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
