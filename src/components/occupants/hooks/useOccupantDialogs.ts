
import { useState } from "react";
import type { Occupant } from "../types/occupantTypes";

export function useOccupantDialogs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignKeysDialogOpen, setIsAssignKeysDialogOpen] = useState(false);
  const [isAssignRoomsDialogOpen, setIsAssignRoomsDialogOpen] = useState(false);
  const [editingOccupant, setEditingOccupant] = useState<Occupant | null>(null);

  const startEdit = (occupant: Occupant) => {
    setEditingOccupant(occupant);
    setIsEditDialogOpen(true);
  };

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isAssignKeysDialogOpen,
    setIsAssignKeysDialogOpen,
    isAssignRoomsDialogOpen,
    setIsAssignRoomsDialogOpen,
    editingOccupant,
    startEdit
  };
}
