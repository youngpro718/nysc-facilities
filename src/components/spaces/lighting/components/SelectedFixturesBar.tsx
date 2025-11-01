
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SelectedFixturesBarProps {
  count: number;
  onDelete: () => void;
}

export function SelectedFixturesBar({ count, onDelete }: SelectedFixturesBarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <span>{count} fixtures selected</span>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Selected
      </Button>
    </div>
  );
}
