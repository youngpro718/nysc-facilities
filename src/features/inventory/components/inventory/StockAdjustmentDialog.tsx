import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
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
import { useToast } from "@shared/hooks/use-toast";
import { FormButtons } from "@/components/ui/form-buttons";
import { Plus, Minus, RotateCw } from "lucide-react";
import { inventoryQueryKeys } from "@features/inventory/hooks/useOptimizedInventory";
import { invalidateInventoryStockQueries } from "@features/inventory/utils/invalidation";
import { getErrorMessage } from "@/lib/errorUtils";

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
      const minimumAllowed = adjustmentType === "adjustment" ? 0 : 1;
      if (isNaN(adjustmentQuantity) || adjustmentQuantity < minimumAllowed) {
        throw new Error("Please enter a valid quantity");
      }

      const currentQuantity = Number(item.quantity) || 0;

      // Calculate new quantity
      const newQuantity = adjustmentType === "add"
        ? currentQuantity + adjustmentQuantity
        : adjustmentType === "remove"
        ? Math.max(0, currentQuantity - adjustmentQuantity)
        : adjustmentQuantity;

      console.log("[StockAdjustment] updating", { itemId: item.id, currentQuantity, newQuantity, adjustmentType });

      // CRITICAL: First update the inventory_items table
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ quantity: newQuantity })
        .eq("id", item.id);

      if (updateError) {
        console.error("[StockAdjustment] update error", updateError);
        throw updateError;
      }

      // Then create transaction record
      const { error: transactionError } = await supabase
        .from("inventory_item_transactions")
        .insert({
          item_id: item.id,
          transaction_type: adjustmentType,
          quantity: adjustmentQuantity,
          previous_quantity: currentQuantity,
          new_quantity: newQuantity,
          notes: notes || null,
        });

      if (transactionError) {
        console.error("[StockAdjustment] transaction insert error", transactionError);
        // Non-fatal: the stock change already succeeded.
      }

      return { adjustmentQuantity, newQuantity };
    },
    onSuccess: (result) => {
      toast({
        title: "Stock adjusted",
        description: `Successfully ${adjustmentType === "add" ? "added" : adjustmentType === "remove" ? "removed" : "adjusted"} ${result?.adjustmentQuantity ?? quantity} ${item.unit || "units"} for ${item.name}.`,
      });
      handleClose();

      // Refresh caches after closing so a stray throw can't trap the dialog open.
      try {
        invalidateInventoryStockQueries(queryClient);
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "inventory-items" ||
            query.queryKey[0] === "inventory-stats" ||
            query.queryKey[0] === "recent-transactions" ||
            query.queryKey[0] === "optimized-inventory",
        });
      } catch (err) {
        console.error("[StockAdjustment] invalidation error", err);
      }
    },
    onError: (error) => {
      console.error("[StockAdjustment] mutation error", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to adjust stock: ${getErrorMessage(error)}`,
      });
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("[StockAdjustment] submit clicked", { isPending: adjustStockMutation.isPending });
    if (adjustStockMutation.isPending) return;
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
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={`Adjust Stock - ${item.name}`}
    >
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
            <Label htmlFor="stock-adjustment-type">Adjustment Type</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value: "add" | "remove" | "adjustment") => setAdjustmentType(value)}
            >
              <SelectTrigger id="stock-adjustment-type" aria-label="Adjustment type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Add Stock
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
                    Remove Stock
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
              min={adjustmentType === "adjustment" ? "0" : "1"}
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
    </ModalFrame>
  );
};
