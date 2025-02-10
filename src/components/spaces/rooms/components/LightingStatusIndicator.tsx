
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

interface LightingStatusIndicatorProps {
  roomId?: string;
}

export function LightingStatusIndicator({ roomId }: LightingStatusIndicatorProps) {
  const { data: roomLighting } = useQuery({
    queryKey: ['room-lighting-status', roomId],
    queryFn: async () => {
      if (!roomId) return null;
      
      const { data, error } = await supabase
        .from('room_lighting_status')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching room lighting status:', error);
        return null;
      }

      return data;
    },
    enabled: !!roomId
  });

  if (!roomId || !roomLighting) {
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
