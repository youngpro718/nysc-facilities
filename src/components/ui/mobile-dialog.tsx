import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileOptimizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showHeader?: boolean;
}

export function MobileOptimizedDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "2xl",
  showHeader = true,
}: MobileOptimizedDialogProps) {
  const isMobile = useIsMobile();

  const maxWidthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md", 
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    full: "sm:max-w-full"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          // Mobile-first: Full width with small margins
          "w-[95vw] max-h-[90vh] overflow-hidden",
          // Desktop: Constrained width
          maxWidthClasses[maxWidth],
          // Mobile-specific adjustments
          isMobile && "m-4 rounded-lg",
          className
        )}
      >
        {showHeader && (title || description) && (
          <DialogHeader className={cn(
            "space-y-2",
            isMobile ? "px-4 pt-4 pb-2" : "px-6 pt-6 pb-4"
          )}>
            {title && (
              <DialogTitle className={cn(
                "text-left",
                isMobile ? "text-lg" : "text-xl"
              )}>
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className={cn(
                "text-left",
                isMobile ? "text-sm" : "text-base"
              )}>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        
        <ScrollArea className={cn(
          "flex-1",
          showHeader && (title || description) 
            ? "max-h-[calc(90vh-8rem)]" 
            : "max-h-[calc(90vh-2rem)]"
        )}>
          <div className={cn(
            isMobile ? "px-4 pb-4" : "px-6 pb-6",
            !showHeader && (isMobile ? "pt-4" : "pt-6")
          )}>
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Convenience wrapper for simple dialogs
export function MobileDialog({
  trigger,
  title,
  description,
  children,
  ...props
}: {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
} & Omit<MobileOptimizedDialogProps, 'children' | 'title' | 'description'>) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      <MobileOptimizedDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        {...props}
      >
        {children}
      </MobileOptimizedDialog>
    </>
  );
}
