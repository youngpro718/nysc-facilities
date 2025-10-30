import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Mobile-optimized Input component
export const MobileInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    label?: string;
    error?: string;
    helperText?: string;
  }
>(({ className, type, label, error, helperText, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          isMobile && "text-base"
        )}>
          {label}
        </Label>
      )}
      <Input
        type={type}
        className={cn(
          // Prevent zoom on iOS by using text-base on mobile
          "text-base md:text-sm",
          // Better touch targets on mobile
          isMobile && "min-h-[44px] px-4",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        // Add mobile-specific attributes
        inputMode={
          type === "tel" ? "tel" :
          type === "email" ? "email" :
          type === "number" ? "numeric" :
          type === "url" ? "url" :
          "text"
        }
        autoComplete={
          type === "email" ? "email" :
          type === "tel" ? "tel" :
          type === "password" ? "current-password" :
          props.name || "off"
        }
        ref={ref}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
});
MobileInput.displayName = "MobileInput";

// Mobile-optimized Textarea component
export const MobileTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & {
    label?: string;
    error?: string;
    helperText?: string;
  }
>(({ className, label, error, helperText, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          isMobile && "text-base"
        )}>
          {label}
        </Label>
      )}
      <Textarea
        className={cn(
          // Prevent zoom on iOS by using text-base on mobile
          "text-base md:text-sm",
          // Better touch targets and spacing on mobile
          isMobile && "min-h-[88px] px-4 py-3",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
});
MobileTextarea.displayName = "MobileTextarea";

// Mobile-optimized form field wrapper
interface MobileFormFieldProps {
  children: React.ReactNode;
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function MobileFormField({
  children,
  label,
  error,
  helperText,
  required,
  className
}: MobileFormFieldProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          isMobile && "text-base",
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}>
          {label}
        </Label>
      )}
      {children}
      {helperText && !error && (
        <p className={cn(
          "text-xs text-muted-foreground",
          isMobile && "text-sm"
        )}>
          {helperText}
        </p>
      )}
      {error && (
        <p className={cn(
          "text-xs text-destructive",
          isMobile && "text-sm"
        )}>
          {error}
        </p>
      )}
    </div>
  );
}

// Mobile-optimized form layout
interface MobileFormLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function MobileFormLayout({
  children,
  className,
  title,
  description
}: MobileFormLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "space-y-6",
      isMobile ? "space-y-4 p-4" : "space-y-6 p-6",
      className
    )}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className={cn(
              "text-xl font-semibold",
              isMobile && "text-lg"
            )}>
              {title}
            </h2>
          )}
          {description && (
            <p className={cn(
              "text-sm text-muted-foreground",
              isMobile && "text-base"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn(
        "space-y-4",
        isMobile && "space-y-3"
      )}>
        {children}
      </div>
    </div>
  );
}

// Mobile-optimized form actions
interface MobileFormActionsProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean; // Stick to bottom on mobile
}

export function MobileFormActions({
  children,
  className,
  sticky = false
}: MobileFormActionsProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "flex gap-3 pt-4 border-t",
      isMobile ? (
        sticky 
          ? "fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t safe-area-bottom"
          : "flex-col-reverse"
      ) : "flex-row justify-end",
      className
    )}>
      {children}
    </div>
  );
}

// Enhanced Button for mobile
export const MobileButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, size, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <Button
      size={isMobile ? "lg" : size}
      className={cn(
        // Better touch targets on mobile
        isMobile && "min-h-[44px] text-base font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
MobileButton.displayName = "MobileButton";
