
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileTextIcon,
  ArrowLeftIcon,
  Loader2,
  CalendarIcon,
  MapPinIcon,
  ClipboardIcon,
} from "lucide-react";
import { TermAssignmentsList } from "@/components/terms/TermAssignmentsList";
import { TermPersonnelList } from "@/components/terms/TermPersonnelList";
import { useToast } from "@/hooks/use-toast";
import { type Term } from "@/types/terms";

export function TermDetails() {
  const { termId } = useParams<{ termId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: term, isLoading, error } = useQuery({
    queryKey: ["term", termId],
    queryFn: async () => {
      if (!termId) throw new Error("Term ID is required");
      
      const { data, error } = await supabase
        .from("term_details")
        .select("*")
        .eq("id", termId)
        .single();
      
      if (error) throw error;
      
      // Transform the data to ensure assignments are properly typed
      const formattedTerm = {
        ...data,
        assignments: Array.isArray(data.assignments) 
          ? data.assignments 
          : typeof data.assignments === 'string'
            ? JSON.parse(data.assignments)
            : []
      } as Term;
      
      return formattedTerm;
    },
    enabled: !!termId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !term) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8">
          <CardHeader>
            <CardTitle>Error Loading Term</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Failed to load term details"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/terms")}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Terms
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/terms")} className="mr-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Terms
          </Button>
          <h1 className="text-2xl font-bold">Term Details</h1>
        </div>
        <Button onClick={() => window.open(term.pdf_url, '_blank')}>
          <FileTextIcon className="h-4 w-4 mr-2" />
          View Term Sheet PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{term.term_name}</CardTitle>
              {term.term_number && (
                <CardDescription className="text-lg mt-1">Term {term.term_number}</CardDescription>
              )}
            </div>
            <div>{getStatusBadge(term.status)}</div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Term Dates</p>
                <p className="text-muted-foreground">
                  {format(new Date(term.start_date), "MMMM d, yyyy")} - {format(new Date(term.end_date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{term.location}</p>
              </div>
            </div>
          </div>

          {term.description && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{term.description}</p>
            </div>
          )}

          <div className="mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="assignments" className="flex gap-2 items-center">
                  <ClipboardIcon className="h-4 w-4" />
                  Assignments ({term.assignment_count || 0})
                </TabsTrigger>
                <TabsTrigger value="personnel" className="flex gap-2 items-center">
                  <ClipboardIcon className="h-4 w-4" />
                  Personnel
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="assignments" className="mt-4">
                <TermAssignmentsList termId={term.id} assignments={term.assignments || []} />
              </TabsContent>
              
              <TabsContent value="personnel" className="mt-4">
                <TermPersonnelList termId={term.id} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TermDetails;
