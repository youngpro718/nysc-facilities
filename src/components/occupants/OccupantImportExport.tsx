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
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface OccupantImportExportProps {
  occupants?: any[];
  onImportSuccess?: () => void;
}

export function OccupantImportExport({ occupants = [], onImportSuccess }: OccupantImportExportProps) {
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
  
  // Export field selection
  const [exportFields, setExportFields] = useState({
    first_name: true,
    last_name: true,
    email: true,
    department: true,
    title: true,
    employment_type: true,
    access_level: true,
    phone: false,
    status: true,
    created_at: true
  });

  const exportToExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Occupants');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateEmail = (email: string): boolean => {
    return email && email.endsWith('@nycourt.gov');
  };

  const handleExport = async () => {
    if (!occupants?.length) {
      toast({
        title: "No data to export",
        description: "No occupants available for export.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    const exportData = occupants.map(occupant => {
      const row: any = {};
      selectedFields.forEach(field => {
        switch (field) {
          case 'created_at':
            row[field] = occupant.created_at ? new Date(occupant.created_at).toLocaleDateString() : '';
            break;
          default:
            row[field] = occupant[field] || '';
        }
      });
      return row;
    });

    exportToExcel(exportData, `occupants_export_${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Export successful",
      description: `Exported ${exportData.length} occupants with ${selectedFields.length} fields.`,
    });
  };

  const handleDownloadTemplate = () => {
    const template = [{
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@nycourt.gov",
      department: "Court Operations",
      role: "judge",
      court_position: "Supreme Court Justice",
      title: "Judge",
      employment_type: "full_time",
      access_level: "standard",
      phone: "+1234567890",
      status: "active"
    }];

    exportToExcel(template, "occupant_import_template");
    
    toast({
      title: "Template downloaded",
      description: "Use this template to format your occupant import data correctly. All emails must end with @nycourt.gov",
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

    setIsProcessing(true);
    setImportProgress(0);
    setImportResults({ successful: 0, failed: 0, errors: [] });

    try {
      const data = await parseExcelFile(importFile);
      
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

          if (!validateEmail(row.email)) {
            throw new Error('Email must end with @nycourt.gov');
          }

          if (!row.first_name || typeof row.first_name !== 'string') {
            throw new Error('Missing or invalid first_name field');
          }

          if (!row.last_name || typeof row.last_name !== 'string') {
            throw new Error('Missing or invalid last_name field');
          }

          // Check if occupant already exists
          const { data: existingOccupant } = await supabase
            .from('occupants')
            .select('id')
            .eq('email', String(row.email).trim().toLowerCase())
            .single();

          if (existingOccupant) {
            throw new Error('Occupant with this email already exists');
          }

          // Create occupant record
          const occupantData: any = {
            first_name: String(row.first_name).trim(),
            last_name: String(row.last_name).trim(),
            email: String(row.email).trim().toLowerCase(),
            department: row.department ? String(row.department).trim() : null,
            title: row.title ? String(row.title).trim() : null,
            employment_type: row.employment_type || 'full_time',
            access_level: row.access_level || 'standard',
            phone: row.phone ? String(row.phone).trim() : null,
            status: row.status || 'active'
          };

          // Add role and court position if provided
          if (row.role) {
            occupantData.role = String(row.role).trim().toLowerCase();
          }
          if (row.court_position) {
            occupantData.court_position = String(row.court_position).trim();
          }

          const { error: occupantError } = await supabase
            .from('occupants')
            .insert(occupantData);

          if (occupantError) throw occupantError;

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
          description: `Successfully imported ${successful} occupants${failed > 0 ? ` (${failed} failed)` : ''}.`,
        });
      }

      if (failed > 0) {
        toast({
          title: "Import completed with errors",
          description: `${failed} occupants failed to import. Check the results for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import occupant data.",
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
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Occupant Import/Export</DialogTitle>
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
                {occupants?.length || 0} occupants available
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
                <CardTitle className="text-sm">Import Court Staff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
                  <strong>Important:</strong> All email addresses must end with @nycourt.gov. 
                  When staff sign up with matching emails, they'll be automatically linked to their imported profile.
                </div>
                
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
                      {importResults.successful} occupants imported successfully
                    </div>
                  )}
                  {importResults.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {importResults.failed} occupants failed to import
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
                Import Occupants
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}