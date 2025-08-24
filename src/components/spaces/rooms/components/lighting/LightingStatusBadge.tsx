import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LightingStatusBadgeProps {
  roomId: string;
  roomNumber: string;
}

interface RoomLightingStatus {
  total: number;
  functional: number;
  issues: number;
  hasDownFixtures: boolean;
}

export function LightingStatusBadge({ roomId, roomNumber }: LightingStatusBadgeProps) {
  const navigate = useNavigate();

  const { data: lightingStatus } = useQuery<RoomLightingStatus>({
    queryKey: ['room-lighting-status', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('status, ballast_issue')
        .eq('room_id', roomId);
      
      if (error) throw error;

      const total = data.length;
      const functional = data.filter(f => f.status === 'functional').length;
      const issues = data.filter(f => f.status !== 'functional' || f.ballast_issue).length;
      const hasDownFixtures = data.some(f => f.status === 'non_functional');

      return {
        total,
        functional,
        issues,
        hasDownFixtures
      };
    },
    enabled: !!roomId,
  });

  // Render a neutral badge with counts even when there are no issues
  if (!lightingStatus || lightingStatus.total === 0) {
    return null;
  }

  const hasIssues = lightingStatus.hasDownFixtures || lightingStatus.issues > 0;

  const getStatusVariant = () => {
    if (lightingStatus.hasDownFixtures) return "destructive";
    if (lightingStatus.issues > 0) return "secondary";
    return "outline";
  };

  const getStatusText = () => {
    if (lightingStatus.hasDownFixtures) return `Lights Down (${lightingStatus.functional}/${lightingStatus.total})`;
    if (lightingStatus.issues > 0) return `${lightingStatus.issues} Issues (${lightingStatus.functional}/${lightingStatus.total})`;
    return `${lightingStatus.functional}/${lightingStatus.total} OK`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/lighting?room=${roomNumber}`);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-1 hover:bg-accent/50"
      onClick={handleClick}
    >
      <Badge 
        variant={getStatusVariant()}
        className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
      >
        {lightingStatus.hasDownFixtures ? (
          <AlertTriangle className="h-3 w-3" />
        ) : (
          <Lightbulb className="h-3 w-3" />
        )}
        <span className="text-xs">
          {getStatusText()}
        </span>
      </Badge>
    </Button>
  );
}