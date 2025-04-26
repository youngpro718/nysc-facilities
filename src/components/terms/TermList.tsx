
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  FileTextIcon, 
  Loader2,
  ClipboardListIcon,
  UsersIcon,
  ChevronRightIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface Term {
  id: string;
  term_name: string;
  term_number: string | null;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  pdf_url: string;
  created_at: string;
  assignment_count?: number;
  metadata?: any;
  created_by?: string;
  description?: string;
  updated_at?: string;
}

export function TermList() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchTerms();
  }, []);
  
  const fetchTerms = async () => {
    try {
      setLoading(true);
      
      const { data: termsData, error: termsError } = await supabase
        .from('court_terms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (termsError) {
        throw termsError;
      }
      
      for (const term of termsData) {
        const { count, error: countError } = await supabase
          .from('term_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('term_id', term.id);
          
        if (!countError) {
          term.assignment_count = count;
        }
      }
      
      setTerms(termsData);
    } catch (err: any) {
      console.error("Error fetching terms:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const viewAssignments = (termId: string) => {
    navigate(`/term-assignments/${termId}`);
  };
  
  const viewPersonnel = (termId: string) => {
    navigate(`/term-personnel/${termId}`);
  };
  
  const downloadPdf = (pdfUrl: string, termName: string) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${termName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading term schedules...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500 py-8">
            <p>Error loading terms: {error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => fetchTerms()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (terms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Terms Found</h3>
            <p className="text-muted-foreground mb-6">
              Upload a term sheet PDF to get started.
            </p>
            <Button 
              onClick={() => navigate("/terms?tab=upload")}
            >
              Upload Term
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Term Schedules</CardTitle>
        <CardDescription>
          View and manage uploaded court term schedules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell>
                    <div className="font-medium">{term.term_name}</div>
                    {term.term_number && (
                      <div className="text-xs text-muted-foreground">{term.term_number}</div>
                    )}
                  </TableCell>
                  <TableCell>{term.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(term.status)}</TableCell>
                  <TableCell>
                    {term.assignment_count !== undefined ? (
                      <Badge variant="outline">{term.assignment_count}</Badge>
                    ) : (
                      <Badge variant="outline">-</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => downloadPdf(term.pdf_url, term.term_name)}
                          >
                            <FileTextIcon className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download PDF</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => viewAssignments(term.id)}
                          >
                            <ClipboardListIcon className="h-4 w-4 mr-1" />
                            Assignments
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Assignments</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => viewPersonnel(term.id)}
                          >
                            <UsersIcon className="h-4 w-4 mr-1" />
                            Personnel
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Personnel</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => navigate(`/terms/${term.id}`)}
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default TermList;
