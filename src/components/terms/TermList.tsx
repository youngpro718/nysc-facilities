
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Calendar, 
  ArrowUpRight, 
  Download, 
  Users, 
  Grid3X3, 
  AlertCircle, 
  Search,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  const [filteredTerms, setFilteredTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentCount, setAssignmentCount] = useState<Record<string, number>>({});
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const termId = searchParams.get("termId");

  useEffect(() => {
    // If a termId is provided in URL params, select that term
    if (termId) {
      setSelectedTerm(termId);
    }
  }, [termId]);

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
        setFilteredTerms(data as Term[]);
        
        // If we have terms and none selected, select the first one
        if (data.length > 0 && !selectedTerm) {
          setSelectedTerm(data[0].id);
        }
        
        // Fetch assignment counts for each term
        fetchAssignmentCounts(data as Term[]);
        
      } catch (error) {
        console.error("Error fetching terms:", error);
        toast.error("Failed to load court terms");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTerms();
  }, [activeTab, selectedTerm]);

  // Filter terms when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTerms(terms);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = terms.filter(term => 
        term.term_name.toLowerCase().includes(lowercaseSearch) ||
        term.term_number.toLowerCase().includes(lowercaseSearch) ||
        term.location.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredTerms(filtered);
    }
  }, [searchTerm, terms]);

  const fetchAssignmentCounts = async (terms: Term[]) => {
    setIsLoadingAssignments(true);
    const counts: Record<string, number> = {};
    
    try {
      // Fetch counts for all terms at once using a Promise.all approach
      const promises = terms.map(async (term) => {
        const { count, error } = await supabase
          .from('term_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('term_id', term.id);
          
        if (error) {
          console.error(`Error counting assignments for term ${term.id}:`, error);
          return { termId: term.id, count: 0 };
        }
        
        return { termId: term.id, count: count || 0 };
      });
      
      const results = await Promise.all(promises);
      
      // Convert results to a record object
      results.forEach(result => {
        counts[result.termId] = result.count;
      });
      
      setAssignmentCount(counts);
    } catch (error) {
      console.error("Error fetching assignment counts:", error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleViewAssignments = (termId: string) => {
    navigate(`/terms?tab=assignments&termId=${termId}`);
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
      <div className="w-full space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[250px] w-full" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </CardContent>
        </Card>
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="mb-2">Upload a new term sheet to get started.</p>
            <Button 
              variant="default" 
              onClick={() => navigate('/terms?tab=upload')}
              className="mt-2"
            >
              Upload Term Sheet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Court Terms</CardTitle>
              <CardDescription>
                {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh] rounded-md">
                <div className="flex flex-col gap-1 p-4">
                  {filteredTerms.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No terms match your search</p>
                    </div>
                  ) : (
                    filteredTerms.map((term) => (
                      <Button
                        key={term.id}
                        variant={selectedTerm === term.id ? "default" : "ghost"}
                        className="justify-start w-full text-left"
                        onClick={() => setSelectedTerm(term.id)}
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-1">
                            <span className="font-medium truncate">{term.term_name}</span>
                            {assignmentCount[term.id] > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {assignmentCount[term.id]} assignment{assignmentCount[term.id] !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedTerm && (
            <TermDetail 
              term={terms.find(t => t.id === selectedTerm)!}
              assignmentCount={assignmentCount[selectedTerm] || 0}
              onViewAssignments={handleViewAssignments} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TermDetail({ term, assignmentCount, onViewAssignments }: { 
  term: Term; 
  assignmentCount: number;
  onViewAssignments: (termId: string) => void;
}) {
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
        
        <div className="flex flex-wrap gap-2">
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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewAssignments(term.id)}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            View Assignments
            {assignmentCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {assignmentCount}
              </Badge>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Personnel
          </Button>
        </div>
        
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Term Assignments Summary</h3>
            <Badge variant="outline">{assignmentCount} Total</Badge>
          </div>
          
          {assignmentCount > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                <span>Active Assignments</span>
                <Badge variant="secondary">{assignmentCount}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Click "View Assignments" for detailed term assignments and court part information.
              </p>
            </div>
          ) : (
            <div className="p-4 border border-dashed rounded-md text-center">
              <p className="text-sm text-muted-foreground">
                No assignments have been created for this term yet. You can either:
              </p>
              <div className="mt-2 space-x-2">
                <Button size="sm" variant="outline" onClick={() => onViewAssignments(term.id)}>
                  Add Assignments Manually
                </Button>
                
                <Button size="sm" variant="outline" disabled={!term.pdf_url}>
                  Reprocess PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="ghost" size="sm">
          Create Relocations
        </Button>
        <Button variant="default" size="sm" onClick={() => onViewAssignments(term.id)}>
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
