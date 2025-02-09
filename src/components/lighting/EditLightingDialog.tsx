
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2 } from "lucide-react";
import { LightingFixture } from "./types";
import { CreateFixtureFields } from "./form-sections/CreateFixtureFields";
import { useEditLightingForm } from "./hooks/useEditLightingForm";

export function EditLightingDialog({ 
  fixture, 
  onFixtureUpdated 
}: { 
  fixture: LightingFixture; 
  onFixtureUpdated: () => void; 
}) {
  const [open, setOpen] = useState(false);
  const { form, onSubmit, updateName } = useEditLightingForm(fixture, onFixtureUpdated, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lighting Fixture</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="pr-4">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                <CreateFixtureFields 
                  form={form}
                  onSpaceOrPositionChange={updateName}
                />
                <Button type="submit">Update Fixture</Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
