
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Room } from "../types/RoomTypes";
import { StatusBadge } from "../../StatusBadge";
import { EditSpaceDialog } from "../../EditSpaceDialog";

interface CardFrontProps {
  room: Room;
  onFlip: () => void;
  onDelete: (id: string) => void;
}

export function CardFront({ room, onFlip, onDelete }: CardFrontProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      onDelete(room.id);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold line-clamp-2">
            {room.name}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground">
            {room.room_number && (
              <span className="mr-2">#{room.room_number}</span>
            )}
            <StatusBadge status={room.status} />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onFlip}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Info */}
      <div className="flex flex-col gap-2 text-sm mb-3 flex-grow">
        <div className="flex items-center text-muted-foreground">
          <span className="font-medium mr-2">Type:</span>
          <span>{room.room_type?.replace(/_/g, ' ')}</span>
        </div>
        
        {room.current_function && (
          <div className="flex items-center text-muted-foreground">
            <span className="font-medium mr-2">Function:</span>
            <span>{room.current_function}</span>
          </div>
        )}

        {room.is_storage && (
          <div className="mt-1 flex items-center">
            <Badge variant="outline" className="text-xs">Storage</Badge>
            {room.storage_type && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {room.storage_type?.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        )}

        {room.description && (
          <p className="text-muted-foreground text-xs line-clamp-3 mt-2">
            {room.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-auto pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFlip}
        >
          More Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditClick}
        >
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Edit Dialog */}
      {isEditing && (
        <EditSpaceDialog
          id={room.id}
          type="room"
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
    </div>
  );
}
