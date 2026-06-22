import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChevronDown, Save, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import type { RoomFormData } from "./RoomFormSchema";
import { BasicRoomFields } from "./BasicRoomFields";
import { ParentRoomField } from "./ParentRoomField";
import { StatusField } from "./StatusField";
import { FunctionRealityCheck } from "./wizard/FunctionRealityCheck";
import { StorageFields } from "./StorageFields";
import { CapacityFields } from "./wizard/CapacityFields";
import RoomAccessFields from "./RoomAccessFields";
import { CourtroomPhotoUpload } from "./CourtroomPhotoUpload";
import { GeneralRoomPhotoUpload } from "./wizard/GeneralRoomPhotoUpload";
import { MaintenanceHealthSummary } from "./wizard/MaintenanceHealthSummary";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";
import { RoomFixturesPanel } from "@/features/lighting/components/RoomFixturesPanel";
import { getErrorMessage } from "@/lib/errorUtils";

interface SimplifiedRoomEditorProps {
  form: UseFormReturn<RoomFormData>;
  onSubmit: (data: RoomFormData) => Promise<void>;
  isPending: boolean;
  onCancel: () => void;
  roomId?: string;
}

interface SectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, description, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-card px-4 py-3 text-left",
          "min-h-[48px] hover:bg-accent/40 transition-colors"
        )}
      >
        <div>
          <div className="font-medium text-foreground">{title}</div>
          {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-4 pb-2 space-y-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function SimplifiedRoomEditor({
  form,
  onSubmit,
  isPending,
  onCancel,
  roomId,
}: SimplifiedRoomEditorProps) {
  const floorId = form.watch("floorId");
  const roomType = form.watch("roomType");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        const errors = form.formState.errors;
        const first = Object.entries(errors).find(([, err]) => err?.message);
        toast.error(first ? `${first[0]}: ${(first[1] as { message?: string })?.message}` : "Please fix the errors above");
        return;
      }
      await onSubmit(form.getValues());
    } catch (err) {
      toast.error(`Save failed: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Essentials — always visible */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Essentials</h3>
            <p className="text-xs text-muted-foreground">The fields most edits need.</p>
          </div>
          <BasicRoomFields form={form} />
          <ParentRoomField form={form} floorId={floorId} currentRoomId={roomId} />
          <StatusField form={form} />
        </div>

        <Separator />

        {/* More details — collapsible cards */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">More details</h3>

          <Section title="Function & storage" description="What the room is used for, storage settings">
            <FunctionRealityCheck form={form} />
            <StorageFields form={form} />
          </Section>

          <Section title="Capacity" description="Seating and accessibility limits">
            <CapacityFields form={form} />
          </Section>

          <Section title="Access" description="Keys, doors, and entry points">
            <RoomAccessFields form={form} />
          </Section>

          <Section title="Photos" description="Document the room visually">
            {roomType === RoomTypeEnum.COURTROOM ? (
              <CourtroomPhotoUpload form={form} />
            ) : (
              <GeneralRoomPhotoUpload form={form} roomId={roomId} />
            )}
          </Section>

          {roomId && (
            <Section title="Lighting fixtures" description="Track each fixture (A1, A2, A3…) and its status">
              <RoomFixturesPanel roomId={roomId} floorId={floorId} />
            </Section>
          )}

          <Section title="Maintenance" description="Inspection history and schedule">
            <MaintenanceHealthSummary form={form} roomId={roomId} />
          </Section>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
