
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { FileText, Loader2, AlertTriangle } from "lucide-react";
import { ReportProgress } from "../types";
import { useState } from "react";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  type: string;
  progress?: ReportProgress;
  onGenerate: (type: string) => void;
}

export function ReportCard({ 
  title, 
  description, 
  icon: Icon,
  type,
  progress,
  onGenerate 
}: ReportCardProps) {
  const [showDatabaseWarning, setShowDatabaseWarning] = useState(false);
  const isGenerating = progress?.status === 'generating';
  const isError = progress?.status === 'error';
  const isDatabaseReport = type === 'database';

  const handleGenerateClick = () => {
    if (isDatabaseReport) {
      setShowDatabaseWarning(true);
    } else {
      onGenerate(type);
    }
  };

  const handleConfirmDatabaseGeneration = () => {
    setShowDatabaseWarning(false);
    onGenerate(type);
  };

  return (
    <>
      <div 
        className={cn(
          "space-y-2 p-4 rounded-lg border",
          isGenerating && "bg-muted/50",
          isError && "bg-destructive/10 border-destructive/50"
        )}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        {progress && (
          <div className="space-y-2">
            <Progress value={progress.progress} />
            {progress.message && (
              <p className="text-xs text-muted-foreground">{progress.message}</p>
            )}
          </div>
        )}
        <Button
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full"
          variant={isError ? "destructive" : "default"}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {isError ? "Retry" : "Generate Report"}
            </>
          )}
        </Button>
      </div>

      <Dialog open={showDatabaseWarning} onOpenChange={setShowDatabaseWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Database Export Limitations
            </DialogTitle>
            <DialogDescription>
              Please review the following limitations before generating the database export:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                To optimize PDF generation performance, this export has the following limitations:
              </AlertDescription>
            </Alert>
            
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Limited to 50 records per table</strong> (most recent entries)</li>
              <li>• <strong>Key columns only</strong> (not all database fields)</li>
              <li>• <strong>Maximum 10 rows displayed per table</strong> in PDF</li>
              <li>• <strong>Tables with excess data show truncation warnings</strong></li>
            </ul>
            
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <strong>For complete data:</strong> Export individual table reports or contact your administrator for CSV exports.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDatabaseWarning(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDatabaseGeneration}>
              Generate Summary Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

