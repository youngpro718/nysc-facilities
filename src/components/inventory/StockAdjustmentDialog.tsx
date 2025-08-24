import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormButtons } from "@/components/ui/form-buttons";
import { Plus, Minus, RotateCw } from "lucide-react";
import { inventoryQueryKeys } from "@/hooks/optimized/useOptimizedInventory";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
}

export const StockAdjustmentDialog = ({ open, onOpenChange, item }: StockAdjustmentDialogProps) => {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove" | "adjustment">("add");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const adjustStockMutation = useMutation({
    mutationFn: async () => {
      const adjustmentQuantity = parseInt(quantity);
      if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("inventory_item_transactions")
        .insert({
          item_id: item.id,
          transaction_type: adjustmentType,
          quantity: adjustmentQuantity,
          previous_quantity: item.quantity,
          new_quantity: adjustmentType === "add" 
            ? item.quantity + adjustmentQuantity 
            : adjustmentType === "remove"
            ? Math.max(0, item.quantity - adjustmentQuantity)
            : adjustmentQuantity,
          notes: notes || null,
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      // Invalidate optimized inventory caches to reflect changes immediately
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.dashboardStats() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.allItems() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.categories() });
      toast({
        title: "Stock adjusted",
        description: `Successfully ${adjustmentType === "add" ? "added" : adjustmentType === "remove" ? "removed" : "adjusted"} ${quantity} ${item.unit || "units"} for ${item.name}.`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to adjust stock: " + error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStockMutation.mutate();
  };

  const handleClose = () => {
    setAdjustmentType("add");
    setQuantity("");
    setNotes("");
    onOpenChange(false);
  };

  const getNewQuantity = () => {
    const adjustmentQuantity = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case "add":
        return item.quantity + adjustmentQuantity;
      case "remove":
        return Math.max(0, item.quantity - adjustmentQuantity);
      case "adjustment":
        return adjustmentQuantity;
      default:
        return item.quantity;
    }
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case "add": return <Plus className="h-4 w-4" />;
      case "remove": return <Minus className="h-4 w-4" />;
      case "adjustment": return <RotateCw className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock - {item.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Stock Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Current Stock</p>
            <p className="text-2xl font-bold">
              {item.quantity} {item.unit && <span className="text-base font-normal text-muted-foreground">({item.unit})</span>}
            </p>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value: "add" | "remove" | "adjustment") => setAdjustmentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Add Stock
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    Remove Stock
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-blue-600" />
                    Set Exact Amount
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === "adjustment" ? "New Quantity" : "Quantity to " + (adjustmentType === "add" ? "Add" : "Remove")}
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="0"
              required
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Stock Level:</span>
                <div className="flex items-center gap-2">
                  {getAdjustmentIcon(adjustmentType)}
                  <span className="text-lg font-bold">
                    {getNewQuantity()} {item.unit && <span className="text-sm font-normal text-muted-foreground">({item.unit})</span>}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment, supplier info, etc."
              rows={3}
            />
          </div>

          <FormButtons
            onCancel={handleClose}
            isSubmitting={adjustStockMutation.isPending}
            submitLabel="Adjust Stock"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};