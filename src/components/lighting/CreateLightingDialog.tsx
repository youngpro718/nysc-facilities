import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus, Lightbulb, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { lightingFixtureSchema, lightingZoneSchema, LightingFixtureFormData, LightingZoneFormData } from "./schemas/lightingSchema";
import { CreateFixtureFields } from "./form-sections/CreateFixtureFields";
import { CreateZoneFields } from "./form-sections/CreateZoneFields";
import { useLightingSubmit } from "./hooks/useLightingSubmit";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BaseLightingDialog } from "./shared/BaseLightingDialog";
import { StandardFormSection } from "./shared/StandardFormSection";

console.log("CreateLightingDialog: Supabase client loaded:", !!supabase);

// Direct function to fetch lighting zones
const fetchLightingZones = async () => {
  console.log("fetchLightingZones: Starting fetch");
  const { data, error } = await supabase
    .from('lighting_zones')
    .select('*')
    .order('name');
  
  console.log("fetchLightingZones: Result", { data, error });
  if (error) throw error;
  return data || [];
};

interface CreateLightingDialogProps {
  onFixtureCreated: () => void;
  onZoneCreated: () => void;
  trigger?: React.ReactNode;
  initialSpaceId?: string;
  initialSpaceType?: "room" | "hallway";
}

export function CreateLightingDialog({ 
  onFixtureCreated, 
  onZoneCreated, 
  trigger,
  initialSpaceId,
  initialSpaceType 
}: CreateLightingDialogProps) {
  const { open, setOpen, onSubmitFixture, onSubmitZone } = useLightingSubmit(onFixtureCreated, onZoneCreated);
  const [activeTab, setActiveTab] = useState("fixture");
  
  // Form for lighting fixtures
  const fixtureForm = useForm<LightingFixtureFormData>({
    resolver: zodResolver(lightingFixtureSchema),
    defaultValues: {
      name: "",
      type: "standard",
      status: "functional",
      space_id: initialSpaceId || "",
      space_type: initialSpaceType || "room",
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
    queryFn: fetchLightingZones
  });

  const handleFixtureSubmit = async (data: LightingFixtureFormData) => {
    console.log("handleFixtureSubmit: Data", data);
    const success = await onSubmitFixture(data);
    if (success) {
      fixtureForm.reset();
    }
  };

  const handleZoneSubmit = async (data: LightingZoneFormData) => {
    console.log("handleZoneSubmit: Data", data);
    const success = await onSubmitZone(data);
    if (success) {
      zoneForm.reset();
    }
  };

  return (
    <BaseLightingDialog
      open={open}
      onOpenChange={setOpen}
      title="Add Lighting Component"
      description="Create a new lighting fixture or zone in the system with proper configuration and context."
      trigger={
        trigger || (
          <Button data-testid="create-lighting-button" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New</span>
          </Button>
        )
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fixture" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Lighting Fixture
          </TabsTrigger>
          <TabsTrigger value="zone" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Lighting Zone
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fixture" className="space-y-4 mt-6">
          <StandardFormSection
            title="Fixture Configuration"
            description="Set up a new lighting fixture with all necessary technical details and location information."
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
          >
            <Form {...fixtureForm}>
              <form onSubmit={fixtureForm.handleSubmit(handleFixtureSubmit)} className="space-y-6">
                <CreateFixtureFields 
                  form={fixtureForm} 
                  zones={zones} 
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Fixture
                  </Button>
                </div>
              </form>
            </Form>
          </StandardFormSection>
        </TabsContent>
        
        <TabsContent value="zone" className="space-y-4 mt-6">
          <StandardFormSection
            title="Zone Configuration"
            description="Create a new lighting zone to group and manage multiple fixtures together."
            icon={<MapPin className="h-4 w-4 text-primary" />}
          >
            <Form {...zoneForm}>
              <form onSubmit={zoneForm.handleSubmit(handleZoneSubmit)} className="space-y-6">
                <CreateZoneFields form={zoneForm} />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Zone
                  </Button>
                </div>
              </form>
            </Form>
          </StandardFormSection>
        </TabsContent>
      </Tabs>
    </BaseLightingDialog>
  );
}