
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
  FileSpreadsheet, 
  Import, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  FileDown 
} from "lucide-react";
import { InventoryItem } from "./types/inventoryTypes";
import { exportToExcel, parseExcelFile, generateTemplate } from "./excelUtils";
import { useToast } from "@/hooks/use-toast";

interface EnhancedInventoryImportExportProps {
  inventoryData: InventoryItem[];
  onImportSuccess?: (importedItems: any[]) => void;
}

export function EnhancedInventoryImportExport({ 
  inventoryData, 
  onImportSuccess 
}: EnhancedInventoryImportExportProps) {
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
    name: true,
    quantity: true,
    minimum_quantity: true,
    category: true,
    description: true,
    unit: true,
    location_details: true,
    preferred_vendor: false,
    notes: false,
    status: true,
    last_updated: true
  });

  const handleExport = () => {
    if (!inventoryData?.length) {
      toast({
        title: "No data to export",
        description: "No inventory items available for export.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    const exportData = inventoryData.map(item => {
      const row: any = {};
      selectedFields.forEach(field => {
        switch (field) {
          case 'category':
            row[field] = item.category?.name || 'General';
            break;
          case 'last_updated':
            row[field] = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '';
            break;
          default:
            row[field] = item[field as keyof InventoryItem] || '';
        }
      });
      return row;
    });

    try {
      exportToExcel(exportData, `inventory_export_${new Date().toISOString().split('T')[0]}`);
      toast({
        title: "Export successful",
        description: `Exported ${exportData.length} items with ${selectedFields.length} fields.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export inventory data.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    try {
      generateTemplate();
      toast({
        title: "Template downloaded",
        description: "Use this template to format your import data correctly.",
      });
    } catch (error) {
      toast({
        title: "Template download failed",
        description: "Failed to generate template.",
        variant: "destructive",
      });
    }
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
      const importedItems: any[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        setImportProgress(((i + 1) / data.length) * 100);

        try {
          // Process the item (validation is already done in parseExcelFile)
          const processedItem = {
            name: row.name,
            quantity: row.quantity,
            description: row.description,
            minimum_quantity: row.minimum_quantity,
            unit: row.unit,
            location_details: row.location_details,
            preferred_vendor: row.preferred_vendor,
            notes: row.notes,
            status: row.status || 'active'
          };

          importedItems.push(processedItem);
          successful++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 1}: ${errorMessage}`);
        }
      }

      setImportResults({ successful, failed, errors });

      if (successful > 0) {
        onImportSuccess?.(importedItems);
        toast({
          title: "Import completed",
          description: `Successfully imported ${successful} items${failed > 0 ? ` (${failed} failed)` : ''}.`,
        });
      }

      if (failed > 0) {
        toast({
          title: "Import completed with errors",
          description: `${failed} items failed to import. Check the results for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import inventory data.",
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
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Import/Export</DialogTitle>
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
                {inventoryData?.length || 0} items available
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
                <CardTitle className="text-sm">Import File</CardTitle>
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
                  <Label htmlFor="import-file">Select Excel File (.xlsx, .xls, .csv)</Label>
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

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Flexible Field Mapping</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    The import supports various column names. For example:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Name:</strong> "name", "item_name", "item", "product_name"</li>
                    <li>• <strong>Quantity:</strong> "quantity", "qty", "amount", "stock"</li>
                    <li>• <strong>Minimum:</strong> "minimum_quantity", "min_quantity", "minimum", "reorder_level"</li>
                  </ul>
                </div>
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
                      {importResults.successful} items imported successfully
                    </div>
                  )}
                  {importResults.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {importResults.failed} items failed to import
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
                Import Items
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
