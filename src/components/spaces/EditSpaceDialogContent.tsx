
import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { RoomFormFields } from "./forms/RoomFormFields";
import { DoorFormFields } from "./forms/DoorFormFields";
import { HallwayFormFields } from "./forms/HallwayFormFields";
import { SpaceConnectionManager } from "./SpaceConnectionManager";
import { EditSpaceFormData } from "./schemas/editSpaceSchema";
import { Separator } from "@/components/ui/separator";
import { RoomFormData } from "./forms/room/RoomFormSchema";

interface EditSpaceDialogContentProps {
  form: UseFormReturn<EditSpaceFormData> | UseFormReturn<RoomFormData>;
  type: "room" | "door" | "hallway";
  id: string;
  onSubmit: (data: EditSpaceFormData | RoomFormData) => Promise<void>;
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
  useEffect(() => {
    if (form.formState.isDirty) return;
    const currentValues = form.getValues();
    Object.keys(currentValues).forEach(key => {
      const value = currentValues[key as keyof typeof currentValues];
      if (value !== undefined) {
        form.setValue(key as any, value, {
          shouldDirty: false,
          shouldTouch: false
        });
      }
    });
  }, [form]);

  const handleSubmit = async (data: EditSpaceFormData | RoomFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <ScrollArea className="max-h-[80vh]">
      <div className="space-y-6 p-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {type === "room" && (
              <RoomFormFields 
                form={form as UseFormReturn<RoomFormData>}
                floorId={form.getValues("floorId")} 
              />
            )}
            {type === "door" && <DoorFormFields form={form as any} />}
            {type === "hallway" && <HallwayFormFields form={form as any} />}
            
            <Separator className="my-4" />
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </form>
        </Form>

        {type === "room" && (
          <div className="pt-6 border-t">
            <SpaceConnectionManager 
              spaceId={id} 
              spaceType="room"
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
