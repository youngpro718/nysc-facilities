import React from "react";  
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateRoomLightingStatus } from "@/utils/dashboardUtils";

interface LightingStatusIndicatorProps {
  roomId?: string;
}

export function LightingStatusIndicator({ roomId }: LightingStatusIndicatorProps) {
  const { data: roomData } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) return null;
      
      const { data: room, error } = await supabase
        .from('spaces')
        .select(`
          id,
          name,
          room_number,
          lighting_fixtures (
            id,
            status,
            bulb_count
          )
        `)
        .eq('id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching room data:', error);
        return null;
      }

      return room;
    },
    enabled: !!roomId
  });

  if (!roomId || !roomData) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-2">
              <Lightbulb className="h-4 w-4 text-gray-400" />
              <span>No Lighting</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>No lighting fixture assigned</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const roomLighting = calculateRoomLightingStatus(roomData);

  const getStatusColor = () => {
    if (roomLighting.non_working_fixtures > 0) {
      return "text-red-500";
    }
    if (roomLighting.working_fixtures === roomLighting.total_fixtures) {
      return "text-green-500";
    }
    return "text-yellow-500";
  };

  const getStatusText = () => {
    if (roomLighting.total_fixtures === 0) return "No Fixtures";
    if (roomLighting.non_working_fixtures === roomLighting.total_fixtures) return "Not Working";
    if (roomLighting.working_fixtures === roomLighting.total_fixtures) return "All Working";
    return `${roomLighting.working_fixtures}/${roomLighting.total_fixtures} Working`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={cn("gap-2", roomLighting.non_working_fixtures > 0 && "border-red-200")}>
            <Lightbulb className={cn("h-4 w-4", getStatusColor())} />
            <span>{getStatusText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p>Working Fixtures: {roomLighting.working_fixtures}</p>
            <p>Non-working Fixtures: {roomLighting.non_working_fixtures}</p>
            <p>Total Fixtures: {roomLighting.total_fixtures}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
