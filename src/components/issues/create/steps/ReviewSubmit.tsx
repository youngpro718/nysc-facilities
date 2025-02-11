
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../types/IssueTypes";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReviewSubmitProps {
  form: UseFormReturn<FormData>;
  photos: string[];
}

export function ReviewSubmit({ form, photos }: ReviewSubmitProps) {
  const values = form.getValues();

  // Get building, floor, and room details
  const { data: locationDetails } = useQuery({
    queryKey: ['location-details', values.building_id, values.floor_id, values.room_id],
    queryFn: async () => {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          name,
          room_number,
          floors (
            name,
            floor_number,
            buildings (
              name
            )
          )
        `)
        .eq('id', values.room_id)
        .single();

      if (roomError) throw roomError;
      return room;
    },
    enabled: !!(values.building_id && values.floor_id && values.room_id)
  });

  // Get related issues
  const { data: relatedIssues } = useQuery({
    queryKey: ['related-issues', values.room_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('room_id', values.room_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!values.room_id
  });

  return (
    <div className="space-y-6">
      <Card className="p-8 space-y-6 bg-background/50 border-white/10">
        <div>
          <h3 className="text-xl font-semibold mb-4">Location</h3>
          {locationDetails && (
            <div className="space-y-2">
              <p>Building: {locationDetails.floors?.buildings?.name}</p>
              <p>Floor: {locationDetails.floors?.name}</p>
              <p>Room: {locationDetails.room_number} - {locationDetails.name}</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-xl font-semibold mb-4">Issue Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-1">Type</p>
              <p className="text-lg">{values.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Priority</p>
              <p className="text-lg capitalize">{values.priority}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h4 className="text-lg font-medium mb-2">Title</h4>
          <p className="text-lg">{values.title}</p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h4 className="text-lg font-medium mb-2">Description</h4>
          <div 
            className="prose prose-invert max-w-none" 
            dangerouslySetInnerHTML={{ __html: values.description || "" }} 
          />
        </div>

        {photos?.length > 0 && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-medium mb-4">Attached Photos</h4>
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Issue photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {relatedIssues && relatedIssues.length > 0 && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-medium mb-4">Related Issues in This Room</h4>
            <div className="space-y-4">
              {relatedIssues.map((issue) => (
                <Card key={issue.id} className="p-4 bg-background/30">
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Reported: {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
