
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateOrderPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName?: string;
  onCreateOrder: (quantity: number) => void;
  isSubmitting?: boolean;
}

export function CreateOrderPrompt({
  open,
  onOpenChange,
  keyName,
  onCreateOrder,
  isSubmitting = false,
}: CreateOrderPromptProps) {
  const [quantity, setQuantity] = useState<number>(1);

  const handleConfirm = () => {
    if (quantity < 1) return;
    onCreateOrder(quantity);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Order Keys</AlertDialogTitle>
          <AlertDialogDescription>
            {keyName ? `The ${keyName} key is not available.` : 'This key is not available.'} 
            Would you like to order keys?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="quantity">Quantity to Order</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={quantity < 1 || isSubmitting}>
            {isSubmitting ? "Creating Order..." : "Create Order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
