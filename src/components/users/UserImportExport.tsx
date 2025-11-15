import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Import, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  FileDown 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { exportToExcel, sanitizeForExcel, parseExcelFile } from "@/utils/excelExport";

interface UserImportExportProps {
  users?: any[];
  onImportSuccess?: () => void;
}

export function UserImportExport({ users = [], onImportSuccess }: UserImportExportProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  }>({ successful: 0, failed: 0, errors: [] });
  const [isProcessing, setIsProcessing] = useState(false);

  // Basic import safety guards
  const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;
  const ALLOWED_MIME_PREFIXES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv",
    "application/csv"
  ];

  const hasAllowedExtension = (name: string) =>
    ALLOWED_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));

  const hasAllowedMime = (type: string) =>
    !type || ALLOWED_MIME_PREFIXES.some(prefix => type.toLowerCase().startsWith(prefix));
  
  // Export field selection
  const [exportFields, setExportFields] = useState({
    first_name: true,
    last_name: true,
    email: true,
    department: true,
    phone: false,
    verification_status: true,
    created_at: true,
    room_assignments: true
  });

  const exportToExcelLocal = async (data: any[], filename: string) => {
    const sanitized = data.map((row: any) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, sanitizeForExcel(v)])
      )
    );
    await exportToExcel(sanitized, filename, 'Users');
  };

  const handleExport = async () => {
    if (!users?.length) {
      toast({
        title: "No data to export",
        description: "No users available for export.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    const exportData = users.map(user => {
      const row: any = {};
      selectedFields.forEach(field => {
        switch (field) {
          case 'created_at':
            row[field] = user.created_at ? new Date(user.created_at).toLocaleDateString() : '';
            break;
          case 'room_assignments':
            // This would need to be populated from actual room assignment data
            row[field] = 'Not implemented yet';
            break;
          default:
            row[field] = user[field] || '';
        }
      });
      return row;
    });

    await exportToExcelLocal(exportData, `users_export_${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Export successful",
      description: `Exported ${exportData.length} users with ${selectedFields.length} fields.`,
    });
  };

  const handleDownloadTemplate = async () => {
    const template = [{
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      department: "Administration",
      phone: "+1234567890",
      verification_status: "pending",
      room_number: "101",
      assignment_type: "primary"
    }];

    await exportToExcelLocal(template, "user_import_template");
    
    toast({
      title: "Template downloaded",
      description: "Use this template to format your user import data correctly.",
    });
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }

    // File validation guards (size, type, extension)
    if (importFile.size > MAX_IMPORT_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!hasAllowedExtension(importFile.name) || !hasAllowedMime(importFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Only .xlsx, .xls, or .csv files are allowed.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setImportResults({ successful: 0, failed: 0, errors: [] });

    try {
      const data = await parseExcelFile(importFile);
      // Basic header validation
      const requiredHeaders = ["first_name", "last_name", "email"];
      const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
      const hasHeaders = firstRow && typeof firstRow === 'object'
        ? requiredHeaders.every(h => Object.prototype.hasOwnProperty.call(firstRow, h))
        : false;
      if (!hasHeaders) {
        throw new Error("Invalid or missing headers. Required: first_name, last_name, email");
      }
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No valid data found in file');
      }

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        setImportProgress(((i + 1) / data.length) * 100);

        try {
          // Validate required fields
          if (!row.email || typeof row.email !== 'string') {
            throw new Error('Missing or invalid email field');
          }

          if (!row.first_name || typeof row.first_name !== 'string') {
            throw new Error('Missing or invalid first_name field');
          }

          if (!row.last_name || typeof row.last_name !== 'string') {
            throw new Error('Missing or invalid last_name field');
          }

          // Create user profile with generated ID
          const profileId = crypto.randomUUID();
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: profileId,
              first_name: String(row.first_name).trim(),
              last_name: String(row.last_name).trim(),
              email: String(row.email).trim().toLowerCase(),
              department: row.department ? String(row.department).trim() : null,
              phone: row.phone ? String(row.phone).trim() : null,
              verification_status: row.verification_status || 'pending'
            })
            .select()
            .single();

          if (profileError) throw profileError;

          // If room assignment is specified, create the assignment
          if (row.room_number && profile) {
            // Find the room by room number
            const { data: room, error: roomError } = await supabase
              .from('rooms')
              .select('id')
              .eq('room_number', String(row.room_number).trim())
              .single();

            if (room && !roomError) {
              // Create room assignment
              const { error: assignmentError } = await supabase
                .from('occupant_room_assignments')
                .insert({
                  occupant_id: profile.id,
                  room_id: room.id,
                  assignment_type: row.assignment_type || 'general',
                  is_primary: row.assignment_type === 'primary'
                });

              if (assignmentError) {
                console.warn(`Room assignment failed for ${row.email}:`, assignmentError);
              }
            }
          }

          successful++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 1} (${row.email || 'unknown'}): ${errorMessage}`);
        }
      }

      setImportResults({ successful, failed, errors });

      if (successful > 0) {
        onImportSuccess?.();
        toast({
          title: "Import completed",
          description: `Successfully imported ${successful} users${failed > 0 ? ` (${failed} failed)` : ''}.`,
        });
      }

      if (failed > 0) {
        toast({
          title: "Import completed with errors",
          description: `${failed} users failed to import. Check the results for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import user data.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setImportProgress(100);
    }
  };

  const handleFieldToggle = (field: string) => {
    setExportFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Import/Export Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Import/Export</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(exportFields).map(([field, selected]) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={selected}
                        onCheckedChange={() => handleFieldToggle(field)}
                      />
                      <Label htmlFor={field} className="text-sm">
                        {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {users?.length || 0} users available
              </Badge>
              <Button onClick={handleExport} disabled={isProcessing}>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Import Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Use this template for proper formatting
                  </span>
                </div>
                
                <div>
                  <Label htmlFor="import-file">Select Excel File</Label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-muted-foreground mt-2
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                  />
                </div>

                {importFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {importFile.name} ({Math.round(importFile.size / 1024)}KB)
                  </div>
                )}
              </CardContent>
            </Card>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing import...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {(importResults.successful > 0 || importResults.failed > 0) && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {importResults.successful > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {importResults.successful} users imported successfully
                    </div>
                  )}
                  {importResults.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {importResults.failed} users failed to import
                      </div>
                      {importResults.errors.length > 0 && (
                        <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto bg-muted p-2 rounded">
                          {importResults.errors.slice(0, 10).map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                          {importResults.errors.length > 10 && (
                            <div>... and {importResults.errors.length - 10} more errors</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleImport} 
                disabled={!importFile || isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Users
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
