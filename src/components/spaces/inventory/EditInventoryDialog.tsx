
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
