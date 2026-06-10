import { useEffect, useRef } from "react";
import { Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuildingFloors } from "../../hooks/queries/useBuildingFloors";

interface BuildingFloorScopeBarProps {
  buildingId: string;
  floorId: string | null;
  autoExpand?: boolean;
  onClearBuilding: () => void;
  onSelectFloor: (floorId: string | null) => void;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function BuildingFloorScopeBar({
  buildingId,
  floorId,
  autoExpand,
  onClearBuilding,
  onSelectFloor,
}: BuildingFloorScopeBarProps) {
  const { data, isLoading } = useBuildingFloors(buildingId);
  const stripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoExpand && stripRef.current) {
      stripRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [autoExpand]);

  if (isLoading && !data) return null;

  const buildingName = data?.building?.name ?? "Building";
  const floors = data?.floors ?? [];

  return (
    <div
      ref={stripRef}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
    >
      {/* Building chip */}
      <button
        type="button"
        onClick={onClearBuilding}
        aria-label={`Clear ${buildingName} filter`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary",
          "px-3 py-1.5 text-sm font-medium hover:bg-primary/15 transition-colors",
          "min-h-[36px]"
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        <span className="max-w-[180px] truncate">{buildingName}</span>
        <X className="h-3.5 w-3.5 opacity-70" />
      </button>

      <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

      {/* Floor chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 -mx-1 px-1">
        <FloorChip
          label="All floors"
          active={!floorId}
          onClick={() => onSelectFloor(null)}
        />
        {floors.map((f) => (
          <FloorChip
            key={f.id}
            label={f.name || ordinal(f.floor_number)}
            active={floorId === f.id}
            onClick={() => onSelectFloor(f.id)}
          />
        ))}
        {floors.length === 0 && !isLoading && (
          <span className="text-xs text-text-secondary px-2">No floors</span>
        )}
      </div>
    </div>
  );
}

function FloorChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="h-8 rounded-full px-3 text-xs whitespace-nowrap shrink-0"
    >
      {label}
    </Button>
  );
}
