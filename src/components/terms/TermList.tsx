
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Calendar, CalendarRange, MapPin } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Term } from "./types/termTypes";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function TermList() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTerms() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('court_terms')
          .select('*')
          .order('start_date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to ensure it matches the Term interface
          const transformedData: Term[] = data.map(term => ({
            id: term.id,
            term_name: term.term_name,
            term_number: term.term_number,
            location: term.location,
            start_date: term.start_date,
            end_date: term.end_date,
            status: term.status || 'unknown',
            description: term.description,
            pdf_url: term.pdf_url || '',
            created_at: term.created_at,
            created_by: term.created_by,
            updated_at: term.updated_at,
            metadata: term.metadata
          }));
          
          setTerms(transformedData);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
        setError("Failed to load term data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTerms();
  }, []);

  const handleDeleteTerm = async (termId: string) => {
    try {
      // First delete related assignments
      await supabase
        .from('term_assignments')
        .delete()
        .eq('term_id', termId);
      
      // Then delete the term
      const { error } = await supabase
        .from('court_terms')
        .delete()
        .eq('id', termId);
        
      if (error) throw error;
      
      // Update state to remove the deleted term
      setTerms(terms.filter(term => term.id !== termId));
      toast.success("Term sheet deleted successfully");
    } catch (error) {
      console.error("Error deleting term:", error);
      toast.error("Failed to delete term sheet");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "upcoming":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Upcoming</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-gray-500 border-gray-500">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Term Schedules</CardTitle>
          <CardDescription>Loading term data...</CardDescription>
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
          <CardTitle>Term Schedules</CardTitle>
          <CardDescription>Error loading term data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (terms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Term Schedules</CardTitle>
          <CardDescription>No term sheets have been uploaded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Upload a term sheet to see it listed here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Term Schedules</CardTitle>
        <CardDescription>Uploaded term sheets and their assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Term Name</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((term) => (
              <TableRow key={term.id}>
                <TableCell className="font-medium">{term.term_name}</TableCell>
                <TableCell>{term.term_number}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(term.start_date), "MMM d, yyyy")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(term.status)}</TableCell>
                <TableCell>
                  {term.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{term.location}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {term.pdf_url && (
                      <Button variant="outline" size="icon" onClick={() => window.open(term.pdf_url!, "_blank")}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Term Sheet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this term sheet? This action cannot be undone.
                            All assignments for this term will also be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTerm(term.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
