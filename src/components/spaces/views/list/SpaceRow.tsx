
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { StatusEnum } from "../../rooms/types/roomEnums";

interface SpaceRowProps<T> {
  item: T;
  onDelete: (id: string) => void;
  renderCells?: (item: T) => React.ReactNode[];
  type: "room" | "hallway" | "door";
}

export function SpaceRow<T extends { id: string; name: string; status: string; floor_id: string }>({ 
  item,
  onDelete,
  renderCells,
  type
}: SpaceRowProps<T>) {
  const initialData = {
    id: item.id,
    name: item.name,
    status: item.status as StatusEnum,
    floorId: item.floor_id,
  };

  return (
    <>
      {renderCells ? (
        renderCells(item)
      ) : (
        <>
          <TableCell>{item.name}</TableCell>
          <TableCell>{type}</TableCell>
          <TableCell>
            <Badge variant={item.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
              {item.status}
            </Badge>
          </TableCell>
        </>
      )}
      <TableCell className="text-right space-x-2">
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
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </>
  );
}
