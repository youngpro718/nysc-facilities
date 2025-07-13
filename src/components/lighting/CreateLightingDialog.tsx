import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { lightingFixtureSchema, lightingZoneSchema, LightingFixtureFormData, LightingZoneFormData } from "./schemas/lightingSchema";
import { CreateFixtureFields } from "./form-sections/CreateFixtureFields";
import { CreateZoneFields } from "./form-sections/CreateZoneFields";
import { useLightingSubmit } from "./hooks/useLightingSubmit";
import { useQuery } from "@tanstack/react-query";
import { fetchLightingZones } from "@/services/supabase/lightingService";

interface CreateLightingDialogProps {
  onFixtureCreated: () => void;
  onZoneCreated: () => void;
}

export function CreateLightingDialog({ onFixtureCreated, onZoneCreated }: CreateLightingDialogProps) {
  const { open, setOpen, onSubmitFixture, onSubmitZone } = useLightingSubmit(onFixtureCreated, onZoneCreated);
  const [activeTab, setActiveTab] = useState("fixture");
  
  // Form for lighting fixtures
  const fixtureForm = useForm<LightingFixtureFormData>({
    resolver: zodResolver(lightingFixtureSchema),
    defaultValues: {
      name: "",
      type: "standard",
      status: "functional",
      space_id: "",
      space_type: "room",
      room_number: "",
      position: "ceiling",
      technology: "LED",
      bulb_count: 1,
      electrical_issues: {
        short_circuit: false,
        wiring_issues: false,
        voltage_problems: false
      },
      ballast_issue: false,
      ballast_check_notes: null,
      zone_id: null
    }
  });

  // Form for lighting zones
  const zoneForm = useForm<LightingZoneFormData>({
    resolver: zodResolver(lightingZoneSchema),
    defaultValues: {
      name: "",
      type: "general",
      floorId: ""
    }
  });

  // Fetch zones for fixture form
  const { data: zones } = useQuery({
    queryKey: ['lighting_zones'],
    queryFn: () => fetchLightingZones()
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
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Lighting Component</DialogTitle>
          <DialogDescription>
            Create a new lighting fixture or zone in the system.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fixture">Lighting Fixture</TabsTrigger>
            <TabsTrigger value="zone">Lighting Zone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fixture" className="space-y-4">
            <Form {...fixtureForm}>
              <form onSubmit={fixtureForm.handleSubmit(handleFixtureSubmit)} className="space-y-4">
                <CreateFixtureFields 
                  form={fixtureForm} 
                  zones={zones} 
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Fixture
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="zone" className="space-y-4">
            <Form {...zoneForm}>
              <form onSubmit={zoneForm.handleSubmit(handleZoneSubmit)} className="space-y-4">
                <CreateZoneFields form={zoneForm} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Zone
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
