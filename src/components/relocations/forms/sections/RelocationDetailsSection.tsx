
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Term } from "@/components/terms/types/termTypes";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CreateRelocationFormData } from "../../types/relocationTypes";

interface RelocationDetailsSectionProps {
  selectedTermId: string | null;
  setSelectedTermId: (termId: string | null) => void;
  form?: UseFormReturn<CreateRelocationFormData>;
}

export function RelocationDetailsSection({ selectedTermId, setSelectedTermId, form }: RelocationDetailsSectionProps) {
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    const fetchTerms = async () => {
      const { data, error } = await supabase
        .from('court_terms')
        .select('*')
        .order('start_date', { ascending: false });
        
      if (error) {
        console.error("Error fetching terms:", error);
        return;
      }
      
      if (data) {
        const termsData = data.map(term => ({
          id: term.id,
          term_name: term.term_name,
          term_number: term.term_number,
          start_date: term.start_date,
          end_date: term.end_date,
          status: term.status || 'unknown',
          pdf_url: term.pdf_url || '',
          location: term.location,
          description: term.description,
          created_at: term.created_at,
          created_by: term.created_by,
          updated_at: term.updated_at,
          metadata: term.metadata
        }));
        setTerms(termsData);
      }
    };
    
    fetchTerms();
  }, []);

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="term">Court Term</Label>
        <Select onValueChange={setSelectedTermId} defaultValue={selectedTermId || ""}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((term) => (
              <SelectItem key={term.id} value={term.id}>
                {term.term_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
