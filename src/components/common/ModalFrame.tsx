import React from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalFrameProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

const sizeToWidth: Record<ModalSize, string> = {
  sm: "sm:max-w-[480px]",
  md: "sm:max-w-[700px]",
  lg: "sm:max-w-[840px]",
  xl: "sm:max-w-[1024px]",
};

/**
 * ModalFrame standardizes dialog sizing, padding, and scrolling.
 * Usage: Place inside an existing Radix <Dialog> as a drop-in
 * replacement for <DialogContent> + header wrapper.
 */
export function ModalFrame({
  title,
  description,
  size = "md",
  className,
  children,
  headerRight,
}: ModalFrameProps) {
  return (
    <DialogContent
      className={cn(
        "w-[95vw] max-h-[90vh] overflow-y-auto p-0",
        sizeToWidth[size],
        className
      )}
    >
      <DialogHeader className="px-4 pt-4 sm:px-6">
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
