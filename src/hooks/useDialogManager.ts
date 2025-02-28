
import { useState, useCallback, useRef } from "react";

type DialogType = "issueDetails" | "resolution" | "deletion";

export interface DialogState {
  type: DialogType | null;
  isOpen: boolean;
  data?: any;
}

export function useDialogManager() {
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    isOpen: false,
  });
  
  // Use a ref to track dialog closing to prevent race conditions
  const isClosingRef = useRef(false);

  const openDialog = useCallback((type: DialogType, data?: any) => {
    if (isClosingRef.current) return; // Don't open if we're in the process of closing
    
    console.log(`Opening dialog: ${type}`, data);
    setDialogState({ type, isOpen: true, data });
  }, []);

  const closeDialog = useCallback(() => {
    console.log("Closing dialog");
    // Set the closing flag to prevent opening new dialogs during state update
    isClosingRef.current = true;
    
    // Clean up the entire state
    setDialogState({
      type: null,
      isOpen: false,
      data: undefined
    });
    
    // Reset the closing flag after a short delay to ensure state updates properly
    setTimeout(() => {
      isClosingRef.current = false;
    }, 50);
  }, []);

  return {
    dialogState,
    openDialog,
    closeDialog,
  };
}
