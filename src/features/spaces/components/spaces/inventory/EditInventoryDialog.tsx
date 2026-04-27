
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
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
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Item"
      size="sm"
    >
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
          preferred_vendor: initialData.preferred_vendor || "",
          notes: initialData.notes || "",
        }}
      />
    </ModalFrame>
  );
}
