import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomRelocation } from "../types/relocationTypes";
import { supabase } from "@/integrations/supabase/client";
import { Term } from "@/components/terms/types/termTypes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarRange, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";

export function RelocationDetails({ id }: { id: string }) {
  const [relocation, setRelocation] = useState<RoomRelocation | null>(null);
  const [termInfo, setTermInfo] = useState<Term | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelocation = async () => {
      setIsLoading(true);
      try {
        // Fetch relocation data
        const { data: relocationData, error: relocationError } = await supabase
          .from('room_relocations')
          .select('*')
          .eq('id', id)
          .single();

        if (relocationError) {
          throw relocationError;
        }

        if (relocationData) {
          setRelocation(relocationData as RoomRelocation);
          
          // If there's a term_id, fetch the term data
          if (relocationData.term_id) {
            const { data: termData, error: termError } = await supabase
              .from('court_terms')
              .select('id, term_name, term_number, start_date, end_date, status, pdf_url, location, description, created_at, created_by, updated_at, metadata')
              .eq('id', relocationData.term_id)
              .single();
            
            if (termError) {
              console.error("Error fetching term data:", termError);
            } else if (termData) {
              // Transform to match the Term interface
              setTermInfo({
                id: termData.id,
                term_name: termData.term_name,
                term_number: termData.term_number,
                status: termData.status || 'unknown',
                pdf_url: termData.pdf_url || '',
                start_date: termData.start_date,
                end_date: termData.end_date,
                location: termData.location,
                description: termData.description,
                created_at: termData.created_at,
                created_by: termData.created_by, 
                updated_at: termData.updated_at,
                metadata: termData.metadata
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching relocation:", err);
        setError("Failed to load relocation data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelocation();
  }, [id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relocation Details</CardTitle>
          <CardDescription>Loading relocation data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relocation Details</CardTitle>
          <CardDescription>Error loading relocation data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        </CardContent>
        <CardContent>
          <Button variant="outline" onClick={() => navigate("/relocations")}>
            Back to Relocations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!relocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relocation Details</CardTitle>
          <CardDescription>Relocation not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested relocation could not be found.</p>
        </CardContent>
        <CardContent>
          <Button variant="outline" onClick={() => navigate("/relocations")}>
            Back to Relocations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relocation Details</CardTitle>
        <CardDescription>
          Details of the relocation for room {relocation.room_id}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Relocation Type</p>
          <p>{relocation.relocation_type}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Reason</p>
          <p>{relocation.reason}</p>
        </div>
        {termInfo && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Court Term</p>
            <p>{termInfo.term_name}</p>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(termInfo.start_date), "MMM d, yyyy")} -{" "}
                {format(new Date(termInfo.end_date), "MMM d, yyyy")}
              </span>
            </div>
            {termInfo.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{termInfo.location}</span>
              </div>
            )}
            {termInfo.pdf_url && (
              <Button variant="link" size="sm" onClick={() => window.open(termInfo.pdf_url, "_blank")}>
                <FileText className="mr-2 h-4 w-4" />
                View Term Sheet
              </Button>
            )}
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">Notes</p>
          <p>{relocation.notes || "No notes provided."}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={() => navigate("/relocations")}>
          Back to Relocations
        </Button>
        <p className="text-sm text-muted-foreground">
          Created at {format(new Date(relocation.created_at), "MMM d, yyyy h:mm a")}
        </p>
      </CardFooter>
    </Card>
  );
}
