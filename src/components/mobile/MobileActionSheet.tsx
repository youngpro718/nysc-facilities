import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ActionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "secondary";
  disabled?: boolean;
}

interface MobileActionSheetProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  actions: ActionItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileActionSheet({
  trigger,
  title,
  description,
  actions,
  open,
  onOpenChange
}: MobileActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader className="text-left pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        
        <div className="space-y-2 pb-6 pb-safe">
          {actions.map((action, index) => (
            <div key={action.id}>
              <Button
                variant={action.variant || "ghost"}
                className="w-full h-12 justify-start text-left"
                onClick={() => {
                  action.onClick();
                  onOpenChange?.(false);
                }}
                disabled={action.disabled}
              >
                {action.icon && (
                  <span className="mr-3">{action.icon}</span>
                )}
                {action.label}
              </Button>
              {index < actions.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => onOpenChange?.(false)}
        >
          Cancel
        </Button>
      </SheetContent>
    </Sheet>
  );
}