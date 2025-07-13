import { Card, CardContent } from "@/components/ui/card";
import { Room } from "../types/RoomTypes";
import { CardFront } from "./CardFront";

interface SimpleRoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
  onRoomClick?: (room: Room) => void;
}

export function SimpleRoomCard({ room, onDelete, onRoomClick }: SimpleRoomCardProps) {
  return (
    <Card 
      className="h-[320px] overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      onClick={() => onRoomClick?.(room)}
    >
      <CardContent className="p-0 h-full">
        <CardFront 
          room={room} 
          onFlip={() => {}} // No flip functionality for simple card
          onDelete={onDelete} 
        />
      </CardContent>
    </Card>
  );
}