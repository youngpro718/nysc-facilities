import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUp, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

interface RoomExcelImportExportProps {
  projectRef: string;
}

interface ImportResult {
  roomId: string;
  name: string;
  status: "success" | "error";
  changes: string[];
  error?: string;
}

export function RoomExcelImportExport({ projectRef }: RoomExcelImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [importResults, setImportResults] = useState<{
    dryRun: boolean;
    totalRows: number;
    successful: number;
    errors: number;
    results: ImportResult[];
    errorMessages: string[];
  } | null>(null);

  const getEdgeFunctionUrl = (functionName: string) => {
    return `https://${projectRef}.supabase.co/functions/v1/${functionName}`;
  };

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("No active session. Please sign in.");
    return session.access_token;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(getEdgeFunctionUrl("export-rooms"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rooms_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Room data has been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export rooms",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // First do a dry run
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", "true");

      const token = await getAccessToken();
      const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";
      const dryRunResponse = await fetch(getEdgeFunctionUrl("import-rooms"), {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": apikey,
        },
      });

      if (!dryRunResponse.ok) {
        const error = await dryRunResponse.json();
        throw new Error(error.error || "Import validation failed");
      }

      const dryRunResult = await dryRunResponse.json();
      setImportResults(dryRunResult);
      setShowResults(true);

      if (dryRunResult.errors === 0 && dryRunResult.successful > 0) {
        // No errors, proceed with actual import
        const confirmFormData = new FormData();
        confirmFormData.append("file", file);
        confirmFormData.append("dryRun", "false");

        const importResponse = await fetch(getEdgeFunctionUrl("import-rooms"), {
          method: "POST",
          body: confirmFormData,
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": apikey,
          },
        });

        if (!importResponse.ok) {
          const error = await importResponse.json();
          throw new Error(error.error || "Import failed");
        }

        const importResult = await importResponse.json();
        setImportResults(importResult);

        toast({
          title: "Import successful",
          description: `${importResult.successful} rooms updated successfully.`,
        });
      } else if (dryRunResult.errors > 0) {
        toast({
          title: "Import validation failed",
          description: `${dryRunResult.errors} errors found. Please review and try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import rooms",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls"
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-1.5" />
        )}
        Export Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4 mr-1.5" />
        )}
        Import Excel
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {importResults?.errors === 0 ? "Import Successful" : "Import Results"}
            </DialogTitle>
            <DialogDescription>
              {importResults?.dryRun 
                ? "Dry run completed. Review changes before importing."
                : `${importResults?.successful} rooms updated, ${importResults?.errors} errors.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importResults?.errorMessages && importResults.errorMessages.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {importResults.errorMessages.slice(0, 5).map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                    {importResults.errorMessages.length > 5 && (
                      <li>...and {importResults.errorMessages.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-4 space-y-2">
                {importResults?.results.map((result) => (
                  <div
                    key={result.roomId}
                    className={`p-3 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.name}</span>
                      <span className="text-xs text-muted-foreground">({result.roomId.slice(0, 8)}...)</span>
                    </div>
                    {result.changes.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Changes: {result.changes.join(", ")}
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-1 text-xs text-red-600">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
