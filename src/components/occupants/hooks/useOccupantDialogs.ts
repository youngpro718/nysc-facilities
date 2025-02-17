
import { useState } from "react";
import type { Occupant } from "../types/occupantTypes";

export function useOccupantDialogs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editDialogs, setEditDialogs] = useState<Record<string, boolean>>({});
  const [isAssignKeysDialogOpen, setIsAssignKeysDialogOpen] = useState(false);
  const [isAssignRoomsDialogOpen, setIsAssignRoomsDialogOpen] = useState(false);
  const [editingOccupants, setEditingOccupants] = useState<Record<string, Occupant>>({});

  const startEdit = (occupant: Occupant) => {
    setEditingOccupants(prev => ({
      ...prev,
      [occupant.id]: occupant
    }));
    setEditDialogs(prev => ({
      ...prev,
      [occupant.id]: true
    }));
  };

  const closeEdit = (occupantId: string) => {
    setEditDialogs(prev => {
      const newDialogs = { ...prev };
      delete newDialogs[occupantId];
      return newDialogs;
    });
    setEditingOccupants(prev => {
      const newOccupants = { ...prev };
      delete newOccupants[occupantId];
      return newOccupants;
    });
  };

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    editDialogs,
    isAssignKeysDialogOpen,
    setIsAssignKeysDialogOpen,
    isAssignRoomsDialogOpen,
    setIsAssignRoomsDialogOpen,
    editingOccupants,
    startEdit,
    closeEdit
  };
}
