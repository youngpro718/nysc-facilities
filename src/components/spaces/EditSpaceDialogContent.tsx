
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

interface EditSpaceDialogContentProps {
  form: UseFormReturn<EditSpaceFormData>;
  type: "room" | "door" | "hallway";
  id: string;
  onSubmit: (data: EditSpaceFormData) => void;
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
  // Reset form with initial values when they change
  React.useEffect(() => {
    if (form.formState.isDirty) return;
    const currentValues = form.getValues();
    Object.keys(currentValues).forEach(key => {
      const value = currentValues[key as keyof EditSpaceFormData];
      if (value !== undefined) {
        form.setValue(key as keyof EditSpaceFormData, value, {
          shouldDirty: false,
          shouldTouch: false
        });
      }
    });
  }, [form]);

  return (
    <ScrollArea className="max-h-[80vh]">
      <div className="space-y-6 p-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {type === "room" && (
              <RoomFormFields 
                form={form} 
                floorId={form.getValues("floorId")} 
              />
            )}
            {type === "door" && <DoorFormFields form={form} />}
            {type === "hallway" && <HallwayFormFields form={form} />}
            
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
                disabled={isPending}
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
