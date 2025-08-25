
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Room } from "./types/RoomTypes";
import { EnhancedRoom } from "./types/EnhancedRoomTypes";
import { CardFront } from "./components/CardFront";
import { CardBack } from "./components/CardBack";
import { useEnhancedRoomData } from "@/hooks/useEnhancedRoomData";

interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
  onRoomClick?: (room: Room) => void;
  variant?: "default" | "panel";
}

export function RoomCard({ room, onDelete, onRoomClick, variant = "default" }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Fetch enhanced room data
  const { data: enhancedRoom, isLoading } = useEnhancedRoomData(room.id);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(prev => !prev);
  };

  const handleCardClick = () => {
    // Always open details on click, using enhanced data if available
    const displayRoomAny = (enhancedRoom || room) as unknown as Room;
    onRoomClick?.(displayRoomAny);
  };

  // Use enhanced room data if available, fallback to basic room data with safe defaults
  const displayRoom = enhancedRoom || {
    ...room,
    lighting_fixtures: [],
    total_fixtures_count: 0,
    functional_fixtures_count: 0,
    lighting_percentage: 100,
    has_lighting_issues: false,
    room_size_category: 'medium' as const,
    has_persistent_issues: false,
    vacancy_status: 'vacant' as const,
    history_stats: {
      total_issues: 0,
      unique_occupants: 0,
      current_occupants: 0,
      last_issue_date: undefined,
    },
    current_occupants: [],
    space_connections: [],
  };

  return (
    <Card 
      className={`relative ${variant === 'panel' ? 'h-full w-full max-w-none' : 'h-[320px]'} group overflow-hidden ${variant === 'panel' ? 'cursor-default' : 'cursor-pointer'} transition-all duration-200 ease-out ${
        isHovered 
          ? 'shadow-2xl shadow-black/20 dark:shadow-black/40' 
          : 'shadow-md hover:shadow-lg'
      }`}
      onClick={variant === 'panel' ? undefined : handleCardClick}
      onMouseEnter={() => { setIsHovered(true); }}
      onMouseLeave={() => { setIsHovered(false); }}
    >
      <CardContent className="p-0 h-full">
        {/* Perspective wrapper ensures proper 3D rendering of front/back faces */}
        <div
          className="w-full h-full"
          style={{ perspective: '1000px', WebkitPerspective: '1000px' as any }}
        >
          <div 
            className="relative w-full h-full transition-all duration-500"
            style={{ 
              transform: (isFlipped) ? 'rotateY(180deg)' : 'rotateY(0)',
              transformStyle: 'preserve-3d',
              // Cross-browser hints to avoid flattening/tearing
              willChange: 'transform',
              WebkitTransformStyle: 'preserve-3d' as any
            }}
          >
            {/* Front of card */}
            <div 
              className="absolute inset-0 w-full h-full bg-card"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as any }}
            >
              <CardFront room={displayRoom} onFlip={handleFlip} onDelete={onDelete} isHovered={variant === 'panel' ? true : isHovered} />
            </div>
            
            {/* Back of card */}
            <div 
              className="absolute inset-0 w-full h-full bg-card"
              style={{ 
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden' as any,
                transform: 'rotateY(180deg)'
              }}
            >
              <CardBack room={displayRoom} onFlip={handleFlip} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

