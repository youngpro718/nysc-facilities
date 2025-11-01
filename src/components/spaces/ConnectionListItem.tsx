import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2Off, Loader2 } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectionListItemProps {
  connectionId: string;
  connectedSpaceName: string;
  connectionType: string;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

export function ConnectionListItem({
  connectionId,
  connectedSpaceName,
  connectionType,
  isDeleting,
  onDelete,
}: ConnectionListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/5 transition-colors">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{connectedSpaceName}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="capitalize bg-accent/10">
                {connectionType.toLowerCase().replace('_', ' ')}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connection Type</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(connectionId)}
        disabled={isDeleting}
        className="hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Link2Off className="h-4 w-4" />
        )}
        <span className="sr-only">Delete connection</span>
      </Button>
    </div>
  );
}