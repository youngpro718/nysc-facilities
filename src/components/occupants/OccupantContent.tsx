
import { OccupantTable } from "./OccupantTable";
import { OccupantCard } from "./OccupantCard";
import { OccupantQueryResponse } from "./types/occupantTypes";

interface OccupantContentProps {
  view: "grid" | "list";
  occupants: OccupantQueryResponse[];
  expandedRows: Set<string>;
  selectedOccupants: string[];
  onToggleRow: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (occupant: OccupantQueryResponse) => void;
  onDelete: (id: string) => void;
}

export function OccupantContent({
  view,
  occupants,
  expandedRows,
  selectedOccupants,
  onToggleRow,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: OccupantContentProps) {
  if (view === "list") {
    return (
      <div className="w-full overflow-hidden">
        <OccupantTable
          occupants={occupants}
          expandedRows={expandedRows}
          selectedOccupants={selectedOccupants}
          onToggleRow={onToggleRow}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {occupants.map((occupant) => (
        <OccupantCard
          key={occupant.id}
          occupant={occupant}
          isExpanded={expandedRows.has(occupant.id)}
          onToggleExpand={() => onToggleRow(occupant.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
