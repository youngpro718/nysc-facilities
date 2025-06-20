
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Room } from "./types/RoomTypes";
import { CardFront } from "./components/CardFront";
import { CardBack } from "./components/CardBack";

interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function RoomCard({ room, onDelete }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  return (
    <Card className="relative h-[320px] group overflow-hidden">
      <CardContent className="p-0 h-full">
        <div 
          className="relative w-full h-full transition-all duration-500 preserve-3d"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* Front of card */}
          <div 
            className="absolute inset-0 w-full h-full bg-card"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardFront room={room} onFlip={handleFlip} onDelete={onDelete} />
          </div>
          
          {/* Back of card */}
          <div 
            className="absolute inset-0 w-full h-full bg-card"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <CardBack room={room} onFlip={handleFlip} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
