
import { Button } from "@/components/ui/button";

interface IssueListHeaderProps {
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

export const IssueListHeader = ({
  viewMode,
  onViewModeChange,
}: IssueListHeaderProps) => {
  return (
    <div className="flex justify-end mb-4">
      <Button
        variant={viewMode === 'cards' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('cards')}
        className="mr-2"
      >
        Cards
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('table')}
      >
        Table
      </Button>
    </div>
  );
};
