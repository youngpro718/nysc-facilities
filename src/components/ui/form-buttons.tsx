import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormButtonsProps {
  /** Handler for cancel button click */
  onCancel: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Label for submit button (default: "Submit") */
  submitLabel?: string;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Whether to disable both buttons */
  disabled?: boolean;
  /** Additional class names for the container */
  className?: string;
  /** Whether to show a sticky footer with border (for long forms) */
  sticky?: boolean;
}

/**
 * FormButtons - Unified form button component for consistent submit/cancel actions
 * 
 * Standardizes:
 * - Button order: Cancel (left, outline) | Submit (right, primary)
 * - Gap spacing: gap-2 (8px)
 * - Loading state with spinner
 * - Optional sticky positioning for long scrollable forms
 * 
 * Usage:
 * <FormButtons 
 *   onCancel={() => onOpenChange(false)} 
 *   isSubmitting={mutation.isPending}
 *   submitLabel="Save Changes"
 * />
 */
export function FormButtons({
  onCancel,
  isSubmitting = false,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  disabled = false,
  className,
  sticky = false,
}: FormButtonsProps) {
  return (
    <div 
      className={cn(
        "flex justify-end gap-2 pt-4",
        sticky && "sticky bottom-0 py-4 bg-background border-t mt-6",
        className
      )}
    >
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting || disabled}
      >
        {cancelLabel}
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting || disabled}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitLabel === "Submit" ? "Submitting..." : `${submitLabel.replace(/e?$/, "ing")}...`}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
