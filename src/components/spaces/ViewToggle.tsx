import { LayoutGrid, List, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ViewToggleProps {
  view: "grid" | "list" | "master-detail";
  onViewChange: (view: "grid" | "list" | "master-detail") => void;
}

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as "grid" | "list" | "master-detail")}>
      <ToggleGroupItem value="master-detail" aria-label="Master-detail view">
        <PanelLeftOpen className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};