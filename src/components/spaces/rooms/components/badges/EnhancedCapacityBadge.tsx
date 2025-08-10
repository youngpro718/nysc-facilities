import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Users, Calculator, Info, TrendingUp, Pencil } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { calculateRoomCapacity, formatCapacityInfo, type CapacityCalculationResult } from "@/utils/capacityCalculations";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditSpaceDialog } from "../../../EditSpaceDialog";

interface EnhancedCapacityBadgeProps {
  room: EnhancedRoom;
  showDetails?: boolean;
}

export function EnhancedCapacityBadge({ room, showDetails = false }: EnhancedCapacityBadgeProps) {
  const capacityResult = useMemo(() => {
    // Extract dimensions if available from room size data
    const dimensions = room.size ? {
      length: room.size.width, // Note: may need to adjust based on actual data structure
      width: room.size.height,
      height: room.size?.height || 10 // default ceiling height
    } : undefined;

    return calculateRoomCapacity(
      room.room_type as any,
      dimensions,
      room.court_room?.juror_capacity || undefined,
      room.court_room?.spectator_capacity || undefined
    );
  }, [room]);

  const currentOccupancy = room.current_occupants?.length || 0;
  const utilizationPercent = capacityResult.recommendedCapacity > 0 
    ? Math.round((currentOccupancy / capacityResult.recommendedCapacity) * 100)
    : 0;

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return "destructive";
    if (percent >= 75) return "secondary";
    return "default";
  };

  const badgeCore = (
    <Badge 
      variant={getUtilizationColor(utilizationPercent)}
      className="flex items-center gap-1"
    >
      <Users className="h-3 w-3" />
      {currentOccupancy}/{capacityResult.recommendedCapacity}
      {utilizationPercent > 0 && (
        <span className="text-xs">({utilizationPercent}%)</span>
      )}
    </Badge>
  );

  const tooltipOnly = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-accent/50">
            {badgeCore}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          Current occupancy vs. recommended capacity. Click to view details and edit.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (!showDetails) {
    return tooltipOnly;
  }

  return (
    <Dialog>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-accent/50">
                {badgeCore}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            Current occupancy vs. recommended capacity. Click to view details and edit.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ModalFrame
        title={
          <span className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Capacity Analysis - {room.name}
          </span>
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Quick action */}
          <div className="flex justify-end">
            <EditSpaceDialog id={room.id} type="room" variant="custom" initialData={room}>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit capacity & usage
              </Button>
            </EditSpaceDialog>
          </div>

          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Current Occupancy:</span>
                  <span className="font-medium">{currentOccupancy} people</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Recommended Capacity:</span>
                  <span className="font-medium">{capacityResult.recommendedCapacity} people</span>
                </div>
                <Progress value={utilizationPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {utilizationPercent}% utilized
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Capacity Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recommended:</span>
                  <p className="font-medium">{capacityResult.recommendedCapacity} people</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Maximum:</span>
                  <p className="font-medium">{capacityResult.maxOccupancy} people</p>
                </div>
                
                {capacityResult.jurorCapacity && (
                  <div>
                    <span className="text-muted-foreground">Jury:</span>
                    <p className="font-medium">{capacityResult.jurorCapacity} people</p>
                  </div>
                )}
                
                {capacityResult.spectatorCapacity && (
                  <div>
                    <span className="text-muted-foreground">Gallery:</span>
                    <p className="font-medium">{capacityResult.spectatorCapacity} people</p>
                  </div>
                )}
                
                <div>
                  <span className="text-muted-foreground">Wheelchair Accessible:</span>
                  <p className="font-medium">{capacityResult.wheelchairSpaces} spaces</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Calculation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {capacityResult.reasoning}
              </p>
              
              {capacityResult.utilizationTips.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Optimization Tips:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {capacityResult.utilizationTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ModalFrame>
    </Dialog>
  );
}
