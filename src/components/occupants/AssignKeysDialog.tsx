
import { useKeyAssignment } from "@/hooks/useKeyAssignment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeySelectionForm } from "./KeySelectionForm";
import { SpareKeyPrompt } from "./SpareKeyPrompt";

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
    currentSpareCount,
    availableKeys,
    isLoading,
    handleAssign
  } = useKeyAssignment(selectedOccupants, onSuccess, onOpenChange);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading available keys...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const hasAvailableKeys = availableKeys && availableKeys.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Keys to Selected Occupants</DialogTitle>
            <DialogDescription>
              Select a key to assign to {selectedOccupants.length} occupant(s)
            </DialogDescription>
          </DialogHeader>

          <KeySelectionForm
            availableKeys={availableKeys}
            selectedKey={selectedKey}
            onKeySelect={setSelectedKey}
            hasAvailableKeys={hasAvailableKeys}
            selectedOccupantsCount={selectedOccupants.length}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAssign()}
              disabled={!selectedKey || selectedOccupants.length === 0 || isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign Keys"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SpareKeyPrompt
        open={showSpareKeyPrompt}
        onOpenChange={setShowSpareKeyPrompt}
        onConfirm={handleAssign}
        currentSpareCount={currentSpareCount}
      />
    </>
  );
}
