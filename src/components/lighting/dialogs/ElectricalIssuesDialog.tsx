import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { LightingFixture, ElectricalIssues } from "@/types/lighting";

interface ElectricalIssuesDialogProps {
  fixture: LightingFixture;
  onComplete: () => void;
}

export function ElectricalIssuesDialog({ fixture, onComplete }: ElectricalIssuesDialogProps) {
  const [open, setOpen] = useState(false);
  const [electricalIssues, setElectricalIssues] = useState<ElectricalIssues>(fixture.electrical_issues);
  const [ballastIssue, setBallastIssue] = useState(fixture.ballast_issue);
  const [ballastNotes, setBallastNotes] = useState(fixture.ballast_check_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Determine if any electrical issues are present
      const hasElectricalIssues = Object.values(electricalIssues).some(issue => issue);

      // Determine new status based on issues
      let newStatus = fixture.status;
      if (hasElectricalIssues || ballastIssue) {
        newStatus = 'maintenance_needed';
      } else if (newStatus === 'maintenance_needed') {
        newStatus = 'functional';
      }

      // Update the fixture
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({
          electrical_issues: electricalIssues,
          ballast_issue: ballastIssue,
          ballast_check_notes: ballastNotes || null,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', fixture.id);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });

      toast.success("Electrical issues updated successfully");
      onComplete();
      setOpen(false);
    } catch (error: any) {
      console.error('Error updating electrical issues:', error);
      toast.error(error.message || "Failed to update electrical issues");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Electrical Issues
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Electrical Issues</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Electrical Issues</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="short_circuit"
                  checked={electricalIssues.short_circuit}
                  onCheckedChange={(checked) => 
                    setElectricalIssues(prev => ({ ...prev, short_circuit: !!checked }))
                  }
                />
                <label
                  htmlFor="short_circuit"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Short Circuit
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wiring_issues"
                  checked={electricalIssues.wiring_issues}
                  onCheckedChange={(checked) =>
                    setElectricalIssues(prev => ({ ...prev, wiring_issues: !!checked }))
                  }
                />
                <label
                  htmlFor="wiring_issues"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Wiring Issues
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="voltage_problems"
                  checked={electricalIssues.voltage_problems}
                  onCheckedChange={(checked) =>
                    setElectricalIssues(prev => ({ ...prev, voltage_problems: !!checked }))
                  }
                />
                <label
                  htmlFor="voltage_problems"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Voltage Problems
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ballast_issue"
                checked={ballastIssue}
                onCheckedChange={(checked) => setBallastIssue(!!checked)}
              />
              <label
                htmlFor="ballast_issue"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ballast Issue
              </label>
            </div>
            {ballastIssue && (
              <div className="space-y-2">
                <Label>Ballast Notes</Label>
                <Textarea
                  value={ballastNotes}
                  onChange={(e) => setBallastNotes(e.target.value)}
                  placeholder="Enter details about the ballast issue..."
                  className="h-20"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 