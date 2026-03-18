// Dialog Manager — centralized dialog state management

import { useState, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

type DialogType = "issueDetails" | "resolution" | "deletion" | "propertyEdit" | "roomDetails";

export interface DialogState {
  type: DialogType | null;
  isOpen: boolean;
  data?: unknown;
}

export function useDialogManager() {
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    isOpen: false,
  });
  
  // Use a ref to track dialog closing to prevent race conditions
  const isClosingRef = useRef(false);
  const dataRef = useRef<unknown>(null);

  const openDialog = useCallback((type: DialogType, data?: unknown) => {
    if (isClosingRef.current) return; // Don't open if we're in the process of closing
    
    logger.debug(`Opening dialog: ${type}`, data);
    dataRef.current = data; // Store data in ref for consistent access
    setDialogState({ type, isOpen: true, data });
  }, []);

  const closeDialog = useCallback(() => {
    logger.debug("Closing dialog");
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
      dataRef.current = null;
    }, 100);
  }, []);

  const updateDialogData = useCallback((newData: unknown) => {
    if (!dialogState.isOpen || isClosingRef.current) return;
    
    logger.debug("Updating dialog data:", newData);
    dataRef.current = { ...(dataRef.current as any), ...(newData as any) };
    setDialogState(prev => ({
      ...prev,
      data: { ...(prev.data as any), ...(newData as any) }
    }));
  }, [dialogState.isOpen]);

  return {
    dialogState,
    openDialog,
    closeDialog,
    updateDialogData,
    currentData: dataRef.current
  };
}
