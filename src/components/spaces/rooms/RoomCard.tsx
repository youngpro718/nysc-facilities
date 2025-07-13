
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Room } from "./types/RoomTypes";
import { CardFront } from "./components/CardFront";
import { CardBack } from "./components/CardBack";

interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
  onRoomClick?: (room: Room) => void;
}

export function RoomCard({ room, onDelete, onRoomClick }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    if (!isMobile) {
      setIsFlipped(prev => !prev);
    }
  };

  const handleCardClick = () => {
    if (isMobile) {
      onRoomClick?.(room);
    }
  };

  return (
    <Card 
      className="relative h-[320px] group overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      onClick={handleCardClick}
    >
      <CardContent className="p-0 h-full">
        <div 
          className="relative w-full h-full transition-all duration-500 preserve-3d"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: !isMobile && isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* Front of card */}
          <div 
            className="absolute inset-0 w-full h-full bg-card"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardFront room={room} onFlip={handleFlip} onDelete={onDelete} />
          </div>
          
          {/* Back of card - Hidden on mobile */}
          {!isMobile && (
            <div 
              className="absolute inset-0 w-full h-full bg-card"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <CardBack room={room} onFlip={handleFlip} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
