import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Room } from "./types/RoomTypes";
import { CardFront } from "./components/CardFront";
import { CardBack } from "./components/CardBack";
import { useEnhancedRoomData } from "@/hooks/useEnhancedRoomData";
import { RoomQuickEditSheet } from "../RoomQuickEditSheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
  onRoomClick?: (room: Room) => void;
  variant?: "default" | "panel";
}

export function RoomCard({ room, onDelete, onRoomClick, variant = "default" }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch enhanced room data
  const { data: enhancedRoom, isLoading } = useEnhancedRoomData(room.id);

  // Reset flip state when room changes
  React.useEffect(() => {
    setIsFlipped(false);
    setShowQuickEdit(false);
  }, [room.id]);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(prev => !prev);
  };

  const handleQuickNoteClick = () => {
    setShowQuickEdit(true);
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
      className={`relative ${variant === 'panel' ? 'h-full w-full max-w-none' : 'h-[320px]'} group overflow-hidden cursor-default transition-all duration-200 ease-out ${
        isHovered 
          ? 'shadow-2xl shadow-black/20 dark:shadow-black/40' 
          : 'shadow-md hover:shadow-lg'
      }`}
      onMouseEnter={() => { setIsHovered(true); }}
      onMouseLeave={() => { setIsHovered(false); }}
    >
      <CardContent className="p-0 h-full">
        {/* Perspective wrapper ensures proper 3D rendering of front/back faces */}
        <div
          className="w-full h-full overflow-hidden"
          style={{ perspective: '1200px', WebkitPerspective: '1200px' as any }}
        >
          <motion.div 
            className="relative w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 200,
              mass: 0.8
            }}
            style={{ 
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d' as any
            }}
          >
            {/* Front of card */}
            <div 
              className="absolute inset-0 w-full h-full bg-card"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as any }}
            >
              <CardFront 
                room={displayRoom} 
                onFlip={handleFlip} 
                onDelete={onDelete} 
                isHovered={variant === 'panel' ? true : isHovered}
                onQuickNoteClick={handleQuickNoteClick}
              />
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
          </motion.div>
        </div>
      </CardContent>

      <RoomQuickEditSheet
        open={showQuickEdit}
        onClose={() => setShowQuickEdit(false)}
        roomId={room.id}
        roomType={room.room_type || 'office'}
        defaultSection="basic"
      />
    </Card>
  );
}

