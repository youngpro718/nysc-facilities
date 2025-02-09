
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { lightingFixtureSchema, lightingZoneSchema } from "./schemas/lightingSchema";
import type { LightingFixtureFormData, LightingZoneFormData } from "./schemas/lightingSchema";
import { CreateFixtureFields } from "./form-sections/CreateFixtureFields";
import { CreateZoneFields } from "./form-sections/CreateZoneFields";
import { useLightingQueries } from "./hooks/useLightingQueries";
import { useLightingSubmit } from "./hooks/useLightingSubmit";

interface CreateLightingDialogProps {
  onFixtureCreated: () => void;
  onZoneCreated: () => void;
}

export function CreateLightingDialog({ onFixtureCreated, onZoneCreated }: CreateLightingDialogProps) {
  const [activeTab, setActiveTab] = useState<"fixture" | "zone">("fixture");
  const { open, setOpen, onSubmitFixture, onSubmitZone } = useLightingSubmit(onFixtureCreated, onZoneCreated);
  const { floors, zones } = useLightingQueries();

  const fixtureForm = useForm<LightingFixtureFormData>({
    resolver: zodResolver(lightingFixtureSchema),
    defaultValues: {
      name: "",
      type: "standard",
      status: "functional",
      technology: "LED",
      bulb_count: 1,
      electrical_issues: {
        short_circuit: false,
        wiring_issues: false,
        voltage_problems: false
      },
      ballast_issue: false,
      emergency_circuit: false,
      maintenance_notes: "",
      ballast_check_notes: ""
    },
  });

  const zoneForm = useForm<LightingZoneFormData>({
    resolver: zodResolver(lightingZoneSchema),
    defaultValues: {
      name: "",
      type: "general",
      floorId: "",
    },
  });

  const handleFixtureSubmit = async (data: LightingFixtureFormData) => {
    const success = await onSubmitFixture(data);
    if (success) {
      fixtureForm.reset();
    }
  };

  const handleZoneSubmit = async (data: LightingZoneFormData) => {
    const success = await onSubmitZone(data);
    if (success) {
      zoneForm.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Lighting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lighting</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="pr-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fixture" | "zone")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fixture">Fixture</TabsTrigger>
                <TabsTrigger value="zone">Zone</TabsTrigger>
              </TabsList>

              <TabsContent value="fixture">
                <Form {...fixtureForm}>
                  <form onSubmit={fixtureForm.handleSubmit(handleFixtureSubmit)} className="space-y-4">
                    <CreateFixtureFields form={fixtureForm} zones={zones} />
                    <Button type="submit" className="w-full">Create Fixture</Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="zone">
                <Form {...zoneForm}>
                  <form onSubmit={zoneForm.handleSubmit(handleZoneSubmit)} className="space-y-4">
                    <CreateZoneFields form={zoneForm} floors={floors} />
                    <Button type="submit" className="w-full">Create Zone</Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
