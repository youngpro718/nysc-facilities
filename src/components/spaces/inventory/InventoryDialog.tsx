import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Plus, Loader2 } from "lucide-react";
import { InventoryForm } from "./InventoryForm";
import { InventoryFormInputs } from "./types/inventoryTypes";

interface InventoryDialogProps {
  onSubmit: (data: InventoryFormInputs) => Promise<void>;
}

export function InventoryDialog({ onSubmit }: InventoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: InventoryFormInputs) => {
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      await onSubmit(data);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <ModalFrame title="Add New Inventory Item" size="md">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <InventoryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </ModalFrame>
    </Dialog>
  );
}
