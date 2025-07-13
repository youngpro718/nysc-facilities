import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

type CourtTerm = {
  id: string;
  term_name: string;
  term_number: string;
  start_date: string;
  end_date: string;
  status: string;
  location: string;
  description: string;
  pdf_url: string;
  metadata: any;
  uploaded_pdf_path: string;
  term_status: string;
  notes: string;
};

export const CourtTermsPanel = () => {
  const { data: terms, isLoading } = useQuery({
    queryKey: ["court-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_terms")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as CourtTerm[];
    },
  });

  const getTermStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isCurrentTerm = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading court terms...</div>;
  }

  const currentTerms = terms?.filter(term => isCurrentTerm(term.start_date, term.end_date)) || [];
  const upcomingTerms = terms?.filter(term => new Date(term.start_date) > new Date()) || [];
  const pastTerms = terms?.filter(term => new Date(term.end_date) < new Date()) || [];

  return (
    <div className="space-y-6">
      {/* Current Terms */}
      {currentTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Current Terms
          </h3>
          <div className="grid gap-4">
            {currentTerms.map((term) => (
              <Card key={term.id} className="border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{term.term_name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Term {term.term_number}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {term.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(term.start_date), "MMM dd")} - {format(new Date(term.end_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {term.description && (
                      <p className="text-sm text-muted-foreground">{term.description}</p>
                    )}
                    
                    {term.notes && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-800 font-medium text-sm">Notes</div>
                        <p className="text-sm mt-1 text-blue-700">{term.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {term.pdf_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={term.pdf_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-2" />
                            View PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Terms */}
      {upcomingTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Terms
          </h3>
          <div className="grid gap-4">
            {upcomingTerms.slice(0, 3).map((term) => (
              <Card key={term.id} className="border-blue-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{term.term_name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Term {term.term_number}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Starts {format(new Date(term.start_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Upcoming
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Terms - Show most recent 3 */}
      {pastTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            Recent Past Terms
          </h3>
          <div className="grid gap-4">
            {pastTerms.slice(0, 3).map((term) => (
              <Card key={term.id} className="border-gray-200 opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-600">{term.term_name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Term {term.term_number}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Ended {format(new Date(term.end_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {terms?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No court terms found</p>
        </div>
      )}
    </div>
  );
};