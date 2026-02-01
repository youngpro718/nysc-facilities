import React from "react";
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

export type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalFrameBaseProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

interface ModalFrameStandaloneProps extends ModalFrameBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Allow both standalone usage (with open/onOpenChange) and nested usage (inside Dialog)
type ModalFrameProps = ModalFrameStandaloneProps | ModalFrameBaseProps;

const sizeToWidth: Record<ModalSize, string> = {
  sm: "sm:max-w-[480px]",
  md: "sm:max-w-[700px]",
  lg: "sm:max-w-[840px]",
  xl: "sm:max-w-[1024px]",
};

function isStandaloneProps(props: ModalFrameProps): props is ModalFrameStandaloneProps {
  return 'open' in props && 'onOpenChange' in props;
}

/**
 * ModalContent - Content wrapper for use inside existing Dialog components
 * 
 * Use this when you need a DialogTrigger or other Dialog features.
 * For simpler cases, use ModalFrame directly.
 */
export function ModalContent({
  title,
  description,
  size = "md",
  className,
  children,
  headerRight,
}: ModalFrameBaseProps) {
  return (
    <DialogContent
      className={cn(
        "w-[95vw] max-h-[90vh] overflow-y-auto p-0",
        sizeToWidth[size],
        className
      )}
    >
      <DialogHeader className="px-4 pt-4 sm:px-6 border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            {description && (
              <DialogDescription className="mt-1">{description}</DialogDescription>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      </DialogHeader>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </DialogContent>
  );
}

/**
 * ModalFrame - Unified dialog/drawer component for consistent form presentation
 * 
 * Features:
 * - Standardized sizing (sm/md/lg/xl)
 * - Mobile-responsive: renders as drawer on mobile, dialog on desktop
 * - Consistent header with optional headerRight slot
 * - Proper scrolling behavior
 * 
 * Usage (Standalone - preferred for simple dialogs):
 * <ModalFrame open={open} onOpenChange={setOpen} title="Form Title" size="md">
 *   <form>...</form>
 * </ModalFrame>
 * 
 * Usage (Nested - when you need DialogTrigger):
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger>...</DialogTrigger>
 *   <ModalFrame title="Form Title" size="md">
 *     <form>...</form>
 *   </ModalFrame>
 * </Dialog>
 */
export function ModalFrame(props: ModalFrameProps) {
  const {
    title,
    description,
    size = "md",
    className,
    children,
    headerRight,
  } = props;

  const isMobile = useIsMobile();

  // If no open/onOpenChange provided, render as nested content only
  if (!isStandaloneProps(props)) {
    // When nested inside a Dialog, just render the ModalContent
    // Note: Mobile drawer behavior requires standalone usage
    return (
      <ModalContent
        title={title}
        description={description}
        size={size}
        className={className}
        headerRight={headerRight}
      >
        {children}
      </ModalContent>
    );
  }

  const { open, onOpenChange } = props;

  // Mobile: render as drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[92vh] flex flex-col", className)}>
          <DrawerHeader className="pb-3 flex-shrink-0 sticky top-0 bg-background z-10 border-b safe-area-top">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DrawerTitle className="text-base text-left">{title}</DrawerTitle>
                {description && (
                  <DrawerDescription className="text-sm mt-1 text-left">{description}</DrawerDescription>
                )}
              </div>
              {headerRight && <div className="shrink-0">{headerRight}</div>}
            </div>
          </DrawerHeader>
          <div className="px-4 py-3 overflow-y-auto flex-1 min-h-0 pb-safe">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: render as dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent
        title={title}
        description={description}
        size={size}
        className={className}
        headerRight={headerRight}
      >
        {children}
      </ModalContent>
    </Dialog>
  );
}
