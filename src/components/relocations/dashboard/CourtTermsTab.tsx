
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CourtTermData } from "../types/relocationTypes";

export function CourtTermsTab() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const { data: terms, isLoading } = useQuery({
    queryKey: ['court-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_terms')
        .select(`
          id,
          term_name,
          term_number,
          start_date,
          end_date,
          location,
          created_at,
          updated_at
        `);

      if (error) {
        console.error('Error fetching court terms:', error);
        throw error;
      }

      return (data || []).map(term => ({
        id: term.id,
        term_name: `${term.term_name} - ${term.term_number}`,
        term_number: term.term_number,
        start_date: term.start_date,
        end_date: term.end_date,
        location: term.location,
        buildings: []
      })) as CourtTermData[];
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading court terms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {terms?.map((term) => (
          <Card key={term.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                {term.term_name}
                <Badge variant="outline">{term.term_number}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(term.start_date), 'MMM dd')} - {format(new Date(term.end_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{term.location}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSelectedTerm(term.id)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
