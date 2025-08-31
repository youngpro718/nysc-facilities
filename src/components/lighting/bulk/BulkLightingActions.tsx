import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Trash2, Download, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";

interface BulkLightingActionsProps {
  onClearComplete?: () => void;
  onImportComplete?: () => void;
}

export function BulkLightingActions({ onClearComplete, onImportComplete }: BulkLightingActionsProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { fixtures, refetch } = useLightingFixtures();

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy condition

      if (error) throw error;

      toast.success(`Successfully cleared ${fixtures.length} lighting fixtures`);
      refetch();
      onClearComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to clear lighting fixtures");
    } finally {
      setIsClearing(false);
      setShowClearDialog(false);
    }
  };

  const handleImportSampleFixtures = async () => {
    setIsImporting(true);
    try {
      // Sample fixtures with proper naming convention
      const sampleFixtures = [
        {
          name: "100 Centre Street - 16th Floor - 1629B - LED Panel - Ceiling 1",
          type: "standard" as const,
          status: "functional" as const,
          technology: "LED" as const,
          bulb_count: 4,
          position: "ceiling" as const,
          space_type: "room",
          ballast_issue: false,
          electrical_issues: {
            short_circuit: false,
            wiring_issues: false,
            voltage_problems: false
          },
          maintenance_notes: "Regular LED panel for office lighting"
        },
        {
          name: "100 Centre Street - 16th Floor - 1629B - LED Panel - Ceiling 2",
          type: "standard" as const, 
          status: "functional" as const,
          technology: "LED" as const,
          bulb_count: 4,
          position: "ceiling" as const,
          space_type: "room",
          ballast_issue: false,
          electrical_issues: {
            short_circuit: false,
            wiring_issues: false,
            voltage_problems: false
          },
          maintenance_notes: "Regular LED panel for office lighting"
        },
        {
          name: "100 Centre Street - 16th Floor - Hallway East - Fluorescent - Wall 1",
          type: "standard" as const,
          status: "maintenance_needed" as const,
          technology: "Fluorescent" as const,
          bulb_count: 2,
          position: "wall" as const,
          space_type: "hallway",
          ballast_issue: true,
          electrical_issues: {
            short_circuit: false,
            wiring_issues: false,
            voltage_problems: false
          },
          maintenance_notes: "Ballast needs replacement - flickering observed"
        },
        {
          name: "100 Centre Street - 16th Floor - Emergency Exit - Emergency Light - Wall Mount",
          type: "emergency" as const,
          status: "functional" as const,
          technology: "LED" as const,
          bulb_count: 1,
          position: "wall" as const,
          space_type: "hallway",
          ballast_issue: false,
          electrical_issues: {
            short_circuit: false,
            wiring_issues: false,
            voltage_problems: false
          },
          maintenance_notes: "Emergency light - battery backup included"
        }
      ];

      const { error } = await supabase
        .from('lighting_fixtures')
        .insert(sampleFixtures);

      if (error) throw error;

      toast.success(`Successfully imported ${sampleFixtures.length} sample lighting fixtures`);
      refetch();
      onImportComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to import sample fixtures");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 p-6 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Bulk Lighting Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage lighting fixtures database with proper naming conventions
            </p>
          </div>
          <Badge variant="secondary">{fixtures.length} fixtures</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            disabled={isClearing || fixtures.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? "Clearing..." : "Clear All Fixtures"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportSampleFixtures}
            disabled={isImporting}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Import Sample Fixtures"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
          <strong>Naming Convention:</strong> Building - Floor - Room/Area - Fixture Type - Position/Number
          <br />
          <strong>Example:</strong> "100 Centre Street - 16th Floor - 1629B - LED Panel - Ceiling 1"
        </div>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Lighting Fixtures</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all {fixtures.length} lighting fixtures from the database. 
              This cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearDatabase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Fixtures
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}