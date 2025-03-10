
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
    <Card className="overflow-hidden h-[320px] flex">
      <CardContent className="p-0 flex-1 relative">
        <div 
          className="absolute inset-0 w-full h-full backface-hidden transition-transform duration-500"
          style={{ 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            opacity: isFlipped ? 0 : 1,
            zIndex: isFlipped ? 0 : 1,
            pointerEvents: isFlipped ? 'none' : 'auto'
          }}
        >
          <CardFront room={room} onFlip={handleFlip} onDelete={onDelete} />
        </div>
        <div 
          className="absolute inset-0 w-full h-full backface-hidden transition-transform duration-500"
          style={{ 
            transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            opacity: isFlipped ? 1 : 0,
            zIndex: isFlipped ? 1 : 0,
            pointerEvents: isFlipped ? 'auto' : 'none'
          }}
        >
          <CardBack room={room} onFlip={handleFlip} />
        </div>
      </CardContent>
    </Card>
  );
}
