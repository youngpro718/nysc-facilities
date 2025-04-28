
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileTextIcon } from "lucide-react";
import { Term, TermFilterState } from "@/types/terms";
import { TermsHeader } from "./TermsHeader";
import { TermsFilters } from "./TermsFilters";
import { TermsTable } from "./TermsTable";

export function TermList() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TermFilterState>({
    status: null,
    location: null,
    search: "",
  });
  
  // Extract unique locations for the filters
  const locations = useMemo(() => {
    return Array.from(new Set(terms.map(term => term.location))).sort();
  }, [terms]);
  
  useEffect(() => {
    fetchTerms();
  }, []);
  
  const fetchTerms = async () => {
    try {
      setLoading(true);
      
      // Use a better SQL query structure to get terms with assignment count in a single query
      const { data, error: fetchError } = await supabase
        .from('court_terms')
        .select(`
          *,
          term_assignments:term_assignments(count)
        `)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Transform the data to include assignment_count
      const termsWithCounts: Term[] = data.map(term => ({
        ...term,
        assignment_count: term.term_assignments?.[0]?.count || 0
      }));
      
      setTerms(termsWithCounts);
    } catch (err: any) {
      console.error("Error fetching terms:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters to terms
  const filteredTerms = useMemo(() => {
    return terms.filter(term => {
      // Status filter
      if (filters.status && term.status !== filters.status) {
        return false;
      }
      
      // Location filter
      if (filters.location && term.location !== filters.location) {
        return false;
      }
      
      // Search filter (case insensitive)
      if (filters.search && !term.term_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [terms, filters]);
  
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
      <TermsHeader />
      <CardContent>
        <TermsFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          locations={locations} 
        />
        <TermsTable terms={filteredTerms} />
      </CardContent>
    </Card>
  );
}

export default TermList;
