
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import { ReportProgress } from "../types";

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
  const isGenerating = progress?.status === 'generating';
  const isError = progress?.status === 'error';

  return (
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
        onClick={() => onGenerate(type)}
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
  );
}
