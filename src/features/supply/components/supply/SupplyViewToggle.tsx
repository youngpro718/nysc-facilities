import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type SupplyViewMode = 'cards' | 'list';

interface SupplyViewToggleProps {
  viewMode: SupplyViewMode;
  onViewModeChange: (mode: SupplyViewMode) => void;
}

export function SupplyViewToggle({ viewMode, onViewModeChange }: SupplyViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={viewMode} 
      onValueChange={(value) => value && onViewModeChange(value as SupplyViewMode)}
    >
      <ToggleGroupItem value="cards" aria-label="Card view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
