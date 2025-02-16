
import { SpaceCard } from "./grid/SpaceCard";

interface GridViewProps<T> {
  items: T[];
  onDelete: (id: string) => void;
  renderItemContent?: (item: T) => React.ReactNode;
  type: "room" | "hallway" | "door";
}

export function GridView<T extends { id: string; name: string; status: string; floor_id: string }>({ 
  items,
  onDelete,
  renderItemContent,
  type
}: GridViewProps<T>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <SpaceCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          renderContent={renderItemContent}
          type={type}
        />
      ))}
    </div>
  );
}
