
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateRelocationFormData } from "../../types/relocationTypes";
import { Term } from "@/components/terms/types/termTypes";

export function RelocationDetailsSection({
  form,
}: {
  form: UseFormReturn<CreateRelocationFormData>;
}) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      setIsLoadingTerms(true);
      try {
        const { data, error } = await supabase
          .from('court_terms')
          .select('id, term_name, term_number, start_date, end_date, status, pdf_url');
          
        if (error) {
          throw error;
        }
        
        // Transform the data to ensure it matches the Term interface
        const transformedData: Term[] = (data || []).map(term => ({
          id: term.id,
          term_name: term.term_name,
          term_number: term.term_number,
          start_date: term.start_date,
          end_date: term.end_date,
          status: term.status || 'unknown',
          pdf_url: term.pdf_url
        }));
        
        setTerms(transformedData);
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setIsLoadingTerms(false);
      }
    };
    
    fetchTerms();
  }, []);

  const handleTermSelect = (termId: string) => {
    const selectedTerm = terms.find(term => term.id === termId);
    if (selectedTerm) {
      form.setValue("term_id", termId);
      form.setValue("start_date", selectedTerm.start_date);
      form.setValue("end_date", selectedTerm.end_date);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Relocation Details</h2>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="relocation_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relocation Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of relocation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isLoadingTerms && terms.length > 0 && (
          <FormItem>
            <FormLabel>Court Term (Optional)</FormLabel>
            <Select onValueChange={handleTermSelect}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a court term" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.term_name} ({term.term_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Selecting a term will automatically set start and end dates
            </FormDescription>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter reason for relocation"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this relocation"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="term_id"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
