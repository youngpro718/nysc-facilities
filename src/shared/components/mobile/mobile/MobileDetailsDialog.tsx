import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MobileDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: string;
}

export function MobileDetailsDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  maxWidth = "max-w-lg"
}: MobileDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} w-[95vw] max-h-[90vh] p-0 gap-0`}>
        <DialogHeader className="p-4 pb-0 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <DialogTitle className="text-lg leading-tight">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
          <div className="p-4">
            {children}
          </div>
        </ScrollArea>

        {actions && (
          <div className="p-4 border-t bg-muted/20">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}