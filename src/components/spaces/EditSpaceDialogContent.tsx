
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { RoomFormContent } from "./forms/room/RoomFormContent";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";
import { RoomFormData } from "./forms/room/RoomFormSchema";

interface EditSpaceDialogContentProps {
  form: UseFormReturn<RoomFormData>;
  type: "room" | "hallway" | "door";
  id: string;
  onSubmit: (data: RoomFormData) => Promise<void>;
  isPending: boolean;
  onCancel: () => void;
}

export function EditSpaceDialogContent({
  form,
  type,
  id,
  onSubmit,
  isPending,
  onCancel,
}: EditSpaceDialogContentProps) {
  const renderContent = () => {
    if (type === 'hallway') {
      // Use the hallway form content
      return (
        <div>Hallway editing is handled by a different component</div>
      );
    }
    
    if (type === 'door') {
      return (
        <div>Door editing is not yet implemented</div>
      );
    }
    
    // Default to room form content
    return (
      <RoomFormContent
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        onCancel={onCancel}
        roomId={id}
      />
    );
  };

  return (
    <ScrollArea className="max-h-[80vh]">
      <div className="space-y-6 p-1">
        {renderContent()}
      </div>
    </ScrollArea>
  );
}
