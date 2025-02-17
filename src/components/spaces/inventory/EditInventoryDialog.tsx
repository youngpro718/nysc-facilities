
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryForm } from "./InventoryForm";
import { InventoryFormInputs, InventoryItem } from "./types/inventoryTypes";

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InventoryFormInputs) => void;
  isSubmitting?: boolean;
  initialData: InventoryItem;
}

export function EditInventoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: EditInventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <InventoryForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          defaultValues={{
            name: initialData.name,
            quantity: initialData.quantity,
            category_id: initialData.category_id || "",
            description: initialData.description || "",
            minimum_quantity: initialData.minimum_quantity,
            unit: initialData.unit || "",
            location_details: initialData.location_details || "",
            notes: initialData.notes || "",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
