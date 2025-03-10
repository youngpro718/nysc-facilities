
import { useState } from "react";
import { Room } from "../types/RoomTypes";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface FlippableRoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function FlippableRoomCard({ room, onDelete, isLoading = false }: FlippableRoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (isLoading) {
    return (
      <div className="relative w-full h-[320px] flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

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
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <CardBack 
            room={room}
            onFlip={() => setIsFlipped(false)}
          />
        </div>
      </div>
    </div>
  );
}
