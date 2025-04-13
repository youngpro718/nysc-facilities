
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, ArrowUpRight, Download } from "lucide-react";

interface Term {
  id: string;
  term_name: string;
  term_number: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'expired';
  description: string | null;
  pdf_url: string | null;
  created_at: string;
}

export function TermList() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("active");

  useEffect(() => {
    async function fetchTerms() {
      try {
        setIsLoading(true);
        
        let query = supabase
          .from('court_terms')
          .select('*');
          
        if (activeTab !== 'all') {
          query = query.eq('status', activeTab);
        }
        
        const { data, error } = await query
          .order('start_date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setTerms(data as Term[]);
        
        // If we have terms and none selected, select the first one
        if (data.length > 0 && !selectedTerm) {
          setSelectedTerm(data[0].id);
        }
        
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTerms();
  }, [activeTab]);

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
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Term Sheets Found</CardTitle>
          <CardDescription>
            There are no court term sheets available for the selected filter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Upload a new term sheet to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Court Terms</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh] rounded-md">
              <div className="flex flex-col gap-1 p-4">
                {terms.map((term) => (
                  <Button
                    key={term.id}
                    variant={selectedTerm === term.id ? "default" : "ghost"}
                    className="justify-start w-full text-left"
                    onClick={() => setSelectedTerm(term.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{term.term_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-2">
        {selectedTerm && (
          <TermDetail 
            term={terms.find(t => t.id === selectedTerm)!} 
          />
        )}
      </div>
    </div>
  );
}

function TermDetail({ term }: { term: Term }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{term.term_name}</CardTitle>
            <CardDescription>Term {term.term_number} • {term.location}</CardDescription>
          </div>
          {getStatusBadge(term.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(term.start_date), "MMMM d")} - {format(new Date(term.end_date), "MMMM d, yyyy")}
          </span>
        </div>
        
        {term.description && (
          <p className="text-sm">{term.description}</p>
        )}
        
        <div className="flex gap-4">
          {term.pdf_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={term.pdf_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                View PDF
              </a>
            </Button>
          )}
          
          {term.pdf_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={term.pdf_url} download>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
        
        <div className="pt-4">
          <h3 className="text-lg font-medium mb-2">Term Assignments</h3>
          <p className="text-sm text-muted-foreground">
            (Assignment data will be displayed here after PDF parsing is implemented)
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="ghost" size="sm">Create Relocations</Button>
        <Button variant="ghost" size="sm">
          View Details
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function getStatusBadge(status: string) {
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
}
