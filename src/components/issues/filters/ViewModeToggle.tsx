
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { ViewMode } from "../types/FilterTypes";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
      <Button
        variant={viewMode === 'cards' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onViewModeChange('cards')}
        className="h-10 w-10"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onViewModeChange('table')}
        className="h-10 w-10"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
