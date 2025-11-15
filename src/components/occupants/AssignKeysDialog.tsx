
import { KeySelectionForm } from "./KeySelectionForm";
import { SpareKeyPrompt } from "./SpareKeyPrompt";
import { CreateOrderPrompt } from "./CreateOrderPrompt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useKeyAssignment } from "@/hooks/useKeyAssignment";

interface AssignKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOccupants: string[];
  onSuccess: () => void;
}

export function AssignKeysDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: AssignKeysDialogProps) {
  const {
    selectedKey,
    setSelectedKey,
    isAssigning,
    showSpareKeyPrompt,
    setShowSpareKeyPrompt,
    showCreateOrderPrompt,
    setShowCreateOrderPrompt,
    availableKeys,
    isLoading,
    isCreatingOrder,
    handleAssign,
    handleCreateOrder
  } = useKeyAssignment(selectedOccupants, onSuccess, onOpenChange);

  const hasAvailableKeys = !!availableKeys && availableKeys.length > 0;
  
  // Find the name of the selected key for display in the order prompt
  const selectedKeyName = availableKeys?.find(k => k.id === selectedKey)?.name || '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Keys</DialogTitle>
          </DialogHeader>

          <KeySelectionForm
            availableKeys={availableKeys}
            selectedKey={selectedKey}
            onKeySelect={setSelectedKey}
            hasAvailableKeys={hasAvailableKeys}
            selectedOccupantsCount={selectedOccupants.length}
          />

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const key = availableKeys?.find(k => k.id === selectedKey);
                if (key && 'is_passkey' in key && key.is_passkey) {
                  setShowSpareKeyPrompt(true);
                } else {
                  handleAssign();
                }
              }}
              disabled={!selectedKey || isAssigning || !hasAvailableKeys}
            >
              {isAssigning ? "Assigning..." : "Assign Key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SpareKeyPrompt
        open={showSpareKeyPrompt}
        onOpenChange={setShowSpareKeyPrompt}
        onConfirm={handleAssign}
        isSubmitting={isAssigning}
      />

      <CreateOrderPrompt
        open={showCreateOrderPrompt}
        onOpenChange={setShowCreateOrderPrompt}
        keyName={selectedKeyName}
        onCreateOrder={handleCreateOrder}
        isSubmitting={isCreatingOrder}
      />
    </>
  );
}
