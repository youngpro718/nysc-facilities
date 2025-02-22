
import { useState } from "react";

type DialogType = "issueDetails" | "resolution" | "deletion";

interface DialogState {
  type: DialogType | null;
  isOpen: boolean;
  data?: any;
}

export function useDialogManager() {
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    isOpen: false,
  });

  const openDialog = (type: DialogType, data?: any) => {
    setDialogState({ type, isOpen: true, data });
  };

  const closeDialog = () => {
    setDialogState({ type: null, isOpen: false });
  };

  return {
    dialogState,
    openDialog,
    closeDialog,
  };
}
