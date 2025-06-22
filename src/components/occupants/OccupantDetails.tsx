
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactSection } from "./details/ContactSection";
import { EmploymentSection } from "./details/EmploymentSection";
import { LocationSection } from "./details/LocationSection";
import { KeyAssignmentSection } from "./details/KeyAssignmentSection";
import { EditOccupantDialog } from "./dialogs/EditOccupantDialog";
import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { OccupantQueryResponse } from "./types/occupantTypes";

interface OccupantDetailsProps {
  occupantData?: OccupantQueryResponse;
}

function OccupantDetailsComponent({ occupantData }: OccupantDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: occupant, isLoading, refetch } = useQuery({
    queryKey: ["occupant", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select(`
          *,
          key_assignments!key_assignments_occupant_id_fkey (
            id,
            assigned_at,
            returned_at,
            keys (
              id,
              name,
              type,
              is_passkey,
              key_door_locations_table:key_door_locations (
                door_id,
                doors (
                  name
                )
              )
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !occupantData,
  });

  // Use provided data or fetched data
  const currentOccupant = occupantData || occupant;

  if (isLoading && !occupantData) {
    return <div>Loading...</div>;
  }

  if (!currentOccupant) {
    return <div>Occupant not found</div>;
  }

  // Transform the data to match expected interface
  const transformedOccupant: OccupantQueryResponse = {
    ...currentOccupant,
    emergency_contact: typeof currentOccupant.emergency_contact === 'string' 
      ? JSON.parse(currentOccupant.emergency_contact || '{}')
      : currentOccupant.emergency_contact || {},
    rooms: currentOccupant.rooms || [] // Ensure rooms array is always present
  };

  const handleEditSuccess = () => {
    refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!occupantData && (
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {transformedOccupant.first_name} {transformedOccupant.last_name}
            </h1>
            <p className="text-muted-foreground">{transformedOccupant.title}</p>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          Edit Occupant
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keys">Key Assignments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContactSection occupantData={transformedOccupant} />
            <EmploymentSection occupantData={transformedOccupant} />
            <LocationSection occupantData={transformedOccupant} />
          </div>
        </TabsContent>

        <TabsContent value="keys">
          <KeyAssignmentSection occupantData={transformedOccupant} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">History tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditOccupantDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        occupant={transformedOccupant}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default OccupantDetailsComponent;
