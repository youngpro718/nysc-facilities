
import { useState } from "react";
import { Room } from "../types/RoomTypes";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";

interface FlippableRoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function FlippableRoomCard({ room, onDelete }: FlippableRoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full h-[320px] perspective-1000">
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        <div className="absolute w-full h-full backface-hidden">
          <CardFront 
            room={room} 
            onFlip={() => setIsFlipped(true)}
            onDelete={onDelete}
          />
        </div>
        <CardBack 
          room={room}
          onFlip={() => setIsFlipped(false)}
        />
      </div>
    </div>
  );
}
