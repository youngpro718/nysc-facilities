
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { StatusEnum } from "../../rooms/types/roomEnums";

interface SpaceCardProps<T> {
  item: T;
  onDelete: (id: string) => void;
  renderContent?: (item: T) => React.ReactNode;
  type: "room" | "hallway" | "door";
}

export function SpaceCard<T extends { id: string; name: string; status: string; floor_id: string }>({ 
  item,
  onDelete,
  renderContent,
  type
}: SpaceCardProps<T>) {
  const initialData = {
    id: item.id,
    name: item.name,
    status: item.status as StatusEnum,
    floorId: item.floor_id,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{item.name}</span>
          <Badge variant={item.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
            {item.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {renderContent?.(item)}
          <div className="flex gap-2 mt-4">
            {type === "room" && (
              <EditSpaceDialog
                id={item.id}
                type="room"
                initialData={initialData}
              />
            )}
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
