import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[70vh] overflow-y-auto pr-4">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <InventoryForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
