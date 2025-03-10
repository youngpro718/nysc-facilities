
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SpaceRow } from "./list/SpaceRow";

interface ListViewProps<T> {
  items: T[];
  onDelete: (id: string) => void;
  renderRow?: (item: T) => React.ReactNode[];
  type: "room" | "hallway" | "door";
}

export function ListView<T extends { id: string; name: string; status: string; floor_id: string }>({ 
  items,
  onDelete,
  renderRow,
  type
}: ListViewProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <SpaceRow
                item={item}
                onDelete={onDelete}
                renderCells={renderRow}
                type={type}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
