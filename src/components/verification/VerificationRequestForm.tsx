
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Agency, VerificationFormData } from "./types";

export function VerificationRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<VerificationFormData>({
    agencyId: '',
    employeeId: '',
    department: '',
    supportingDocuments: []
  });

  const { data: agencies, isLoading: isLoadingAgencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_affiliations')
        .select('*');
      
      if (error) throw error;
      return data as Agency[];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert([{
          agency_id: formData.agencyId,
          employee_id: formData.employeeId,
          department: formData.department,
          supporting_documents: formData.supportingDocuments
        }]);

      if (error) throw error;

      toast({
        title: "Verification request submitted",
        description: "We'll review your request and get back to you soon."
      });

      // Reset form
      setFormData({
        agencyId: '',
        employeeId: '',
        department: '',
        supportingDocuments: []
      });
    } catch (error) {
      console.error('Error submitting verification request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error submitting your verification request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAgencies) {
    return <div>Loading agencies...</div>;
  }

  return (
    <Card className="w-full max-w-md p-6 mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="agency">Agency</Label>
          <Select
            value={formData.agencyId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, agencyId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an agency" />
            </SelectTrigger>
            <SelectContent>
              {agencies?.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
            placeholder="Enter your employee ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder="Enter your department"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Verification Request"}
        </Button>
      </form>
    </Card>
  );
}
