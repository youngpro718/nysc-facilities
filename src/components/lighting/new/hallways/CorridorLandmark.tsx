import { Button } from '@/components/ui/button';
import { 
  ArrowUpDown, 
  TrendingUp, 
  DoorOpen, 
  GitBranch, 
  DoorClosed, 
  MapPinned,
  GitFork,
  LogOut
} from 'lucide-react';
import { HallwayLandmark } from '@/hooks/useHallwayLandmarks';

interface CorridorLandmarkProps {
  landmark: HallwayLandmark;
  onClick?: () => void;
}

export function CorridorLandmark({ landmark, onClick }: CorridorLandmarkProps) {
  const getLandmarkIcon = (type: HallwayLandmark['type']) => {
    switch (type) {
      case 'elevator_bank':
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
      case 'stairwell':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'entrance':
        return <DoorOpen className="h-4 w-4 text-orange-500" />;
      case 'intersection':
        return <GitBranch className="h-4 w-4 text-purple-500" />;
      case 'room':
        return <DoorClosed className="h-4 w-4 text-muted-foreground" />;
      case 'transit_door':
        return <DoorClosed className="h-4 w-4 text-amber-600" />;
      case 'private_hallway':
        return <GitFork className="h-4 w-4 text-purple-600" />;
      case 'fire_exit':
        return <LogOut className="h-4 w-4 text-red-500" />;
      default:
        return <MapPinned className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-auto p-0 hover:bg-transparent group"
    >
      <div className="flex flex-col items-center gap-1">
        <div className="p-1.5 rounded-full bg-background border-2 border-primary/20 group-hover:border-primary group-hover:shadow-md transition-all">
          {getLandmarkIcon(landmark.type)}
        </div>
        <div className="text-xs font-medium text-foreground/70 group-hover:text-foreground max-w-[80px] text-center truncate">
          {landmark.name}
        </div>
      </div>
    </Button>
  );
}
