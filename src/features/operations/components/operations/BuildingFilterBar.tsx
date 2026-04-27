import { Building2 } from "lucide-react";
import { FilterPills, type FilterPillOption } from "@/components/ui/FilterPills";

interface Building {
  id: string;
  name: string;
}

interface BuildingFilterBarProps {
  buildings: Building[];
  selectedBuildingId: string | null;
  onSelect: (buildingId: string | null) => void;
}

/**
 * Compact pill-style building filter used at the top of facility pages.
 * Selecting "All Buildings" clears the filter (passes null).
 */
export function BuildingFilterBar({
  buildings,
  selectedBuildingId,
  onSelect,
}: BuildingFilterBarProps) {
  const ALL = "__all__";
  const options: FilterPillOption<string>[] = [
    { label: "All Buildings", value: ALL },
    ...buildings.map((b) => ({ label: b.name, value: b.id })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border rounded-lg bg-muted/50">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
      <FilterPills
        options={options}
        value={selectedBuildingId ?? ALL}
        onChange={(v) => onSelect(v === ALL ? null : v)}
        label="Building:"
        ariaLabel="Filter by building"
      />
    </div>
  );
}
