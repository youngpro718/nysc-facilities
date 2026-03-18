import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LightingFixture } from "@/types/lighting";
import { X } from "lucide-react";

export interface LightingFilterState {
  status?: string;
  building?: string;
  floor?: string;
  search?: string;
}

interface LightingFiltersToolbarProps {
  fixtures: LightingFixture[];
  value: LightingFilterState;
  disabledKeys?: (keyof LightingFilterState)[];
  onChange: (next: LightingFilterState) => void;
}

export function LightingFiltersToolbar({ fixtures, value, disabledKeys = [], onChange }: LightingFiltersToolbarProps) {
  const options = useMemo(() => {
    const statuses = Array.from(new Set((fixtures || []).map(f => f.status).filter(Boolean))) as string[];
    const buildings = Array.from(new Set((fixtures || []).map(f => f.building_name).filter(Boolean))) as string[];
    const floors = Array.from(new Set((fixtures || []).map(f => f.floor_name).filter(Boolean))) as string[];
    return { statuses, buildings, floors };
  }, [fixtures]);

  const disabled = (k: keyof LightingFilterState) => disabledKeys.includes(k);

  const clear = () => onChange({});

  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Status</label>
          <Select
            value={value.status ?? "all"}
            onValueChange={(v) => onChange({ ...value, status: v === "all" ? undefined : v })}
            disabled={disabled("status")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {options.statuses.map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Building</label>
          <Select
            value={value.building ?? "all"}
            onValueChange={(v) => onChange({ ...value, building: v === "all" ? undefined : v })}
            disabled={disabled("building")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {options.buildings.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Floor</label>
          <Select
            value={value.floor ?? "all"}
            onValueChange={(v) => onChange({ ...value, floor: v === "all" ? undefined : v })}
            disabled={disabled("floor")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {options.floors.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Search</label>
          <Input
            value={value.search || ""}
            onChange={(e) => onChange({ ...value, search: e.target.value || undefined })}
            placeholder="Name, location..."
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={clear}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
