
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[95vh] pb-safe flex flex-col", className)}>
          {(title || description) && (
            <DrawerHeader className="pb-4 flex-shrink-0">
              {title && <DrawerTitle className="text-center">{title}</DrawerTitle>}
              {description && <DrawerDescription className="text-center">{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div className="px-4 pb-6 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
