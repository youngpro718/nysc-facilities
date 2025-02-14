
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Room } from "../types/RoomTypes";
import { RoomConnections } from "../RoomConnections";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoomInventory } from "../../RoomInventory";
import { Boxes } from "lucide-react";
import { RoomIssueAnalytics } from "../analytics/RoomIssueAnalytics";

interface CardBackProps {
  room: Room;
}

export function CardBack({ room }: CardBackProps) {
  return (
    <Card className="absolute w-full h-full backface-hidden rotate-y-180">
      <CardHeader className="flex-none">
        <CardTitle>Room History</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-5rem)] px-6">
        <div className="space-y-4 pb-6">
          {room.parent_room_id && (
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-sm font-medium">Parent Room</p>
              <p className="text-sm text-muted-foreground break-words">
                {room.parent_room?.name || 'Loading...'}
              </p>
            </div>
          )}
          
          <RoomConnections connections={room.space_connections || []} />

          {room.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground break-words">{room.description}</p>
            </div>
          )}
          
          {room.is_storage && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Inventory</h4>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <Boxes className="h-4 w-4 mr-2" />
                    View Inventory
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Room Inventory - {room.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto">
                    <RoomInventory roomId={room.id} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <RoomIssueAnalytics roomId={room.id} />
        </div>
      </ScrollArea>
    </Card>
  );
}
