
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OccupantForm } from "../OccupantForm";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useOccupantAssignments } from "../hooks/useOccupantAssignments";
import { handleOccupantUpdate } from "../services/occupantService";
import type { Occupant } from "../types/occupantTypes";
import { OccupantStatus } from "../schemas/occupantSchema";

interface EditOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupant: Occupant;
  onSuccess: () => void;
}

export function EditOccupantDialog({
  open,
  onOpenChange,
  occupant,
  onSuccess,
}: EditOccupantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const { data: currentAssignments, isLoading } = useOccupantAssignments(occupant?.id);

  const handleUpdate = async (formData: any) => {
    try {
      console.log("=== EDIT OCCUPANT DEBUG ===");
      console.log("1. Form data received:", formData);
      console.log("2. Occupant ID:", occupant.id);
      console.log("3. Current assignments:", currentAssignments);
      console.log("4. Selected rooms from form:", formData.rooms);
      console.log("5. Selected keys from form:", formData.keys);
      
      setIsSubmitting(true);
      
      const updateParams = {
        occupantId: occupant.id,
        formData: {
          ...formData,
          status: formData.status || "active",
          access_level: formData.access_level || "standard",
        },
        selectedRooms: formData.rooms || [],
        selectedKeys: formData.keys || [],
        currentAssignments,
      };
      
      console.log("6. Update params being sent:", updateParams);
      
      const result = await handleOccupantUpdate(updateParams);
      
      console.log("7. Update result:", result);

      toast.success("Occupant updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("=== UPDATE ERROR ===", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      toast.error(error.message || "Failed to update occupant");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // Validate and transform the access_level to ensure it matches our schema
  const validateAccessLevel = (level?: string): "standard" | "restricted" | "elevated" => {
    if (level && ["standard", "restricted", "elevated"].includes(level)) {
      return level as "standard" | "restricted" | "elevated";
    }
    return "standard";
  };

  // Validate and transform the status to ensure it matches our schema
  const validateStatus = (status?: string): OccupantStatus => {
    if (status && ["active", "inactive", "on_leave", "terminated"].includes(status)) {
      return status as OccupantStatus;
    }
    return "active";
  };

  // Validate and transform the role to ensure it matches our schema
  const validateRole = (role?: string | null): "judge" | "court_aide" | "clerk" | "sergeant" | "court_officer" | "bailiff" | "court_reporter" | "administrative_assistant" | "facilities_manager" | "admin" | null => {
    if (role && ["judge", "court_aide", "clerk", "sergeant", "court_officer", "bailiff", "court_reporter", "administrative_assistant", "facilities_manager", "admin"].includes(role)) {
      return role as "judge" | "court_aide" | "clerk" | "sergeant" | "court_officer" | "bailiff" | "court_reporter" | "administrative_assistant" | "facilities_manager" | "admin";
    }
    return null;
  };

  const initialData = {
    first_name: occupant.first_name,
    last_name: occupant.last_name,
    email: occupant.email,
    phone: occupant.phone,
    department: occupant.department,
    title: occupant.title,
    role: validateRole(occupant.role),
    court_position: occupant.court_position || null,
    status: validateStatus(occupant.status),
    employment_type: occupant.employment_type || null,
    supervisor_id: occupant.supervisor_id || null,
    hire_date: occupant.hire_date || null,
    termination_date: occupant.termination_date || null,
    rooms: currentAssignments?.rooms || [],
    keys: currentAssignments?.keys || [],
    access_level: validateAccessLevel(occupant.access_level),
    emergency_contact: occupant.emergency_contact || null,
    notes: occupant.notes || null,
  };

  const content = (
    <OccupantForm 
      initialData={initialData}
      onSubmit={handleUpdate}
      onCancel={() => onOpenChange(false)}
      isSubmitting={isSubmitting}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit Occupant</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Occupant</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
