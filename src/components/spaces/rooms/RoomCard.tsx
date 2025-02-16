
import { useState } from "react";
import { Room } from "./types/RoomTypes";
import { CardFront } from "./components/CardFront";
import { CardBack } from "./components/CardBack";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function RoomCard({ room, onDelete }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full h-[400px] perspective-1000">
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        <CardFront room={room} onDelete={onDelete} />
        <CardBack room={room} />
      </div>
    </div>
  );
}
