
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
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
