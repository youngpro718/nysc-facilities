// @ts-nocheck
import { useState } from "react";
import { logger } from '@/lib/logger';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileSpreadsheet, 
  Import, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  FileDown,
  Info
} from "lucide-react";
import { InventoryItem } from "./types/inventoryTypes";
import { exportToExcel, parseExcelFile, generateTemplate } from "./excelUtils";
import { fetchAllCategories, validateCategoryData, type Category } from "./utils/categoryUtils";
import { useToast } from "@/hooks/use-toast";

interface EnhancedInventoryImportExportProps {
  inventoryData: InventoryItem[];
  onImportSuccess?: (importedItems: unknown[]) => void;
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
    categoryIssues: string[];
  }>({ successful: 0, failed: 0, errors: [], categoryIssues: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
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

  // Load categories when dialog opens
  const handleDialogOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && categories.length === 0) {
      setLoadingCategories(true);
      try {
        const fetchedCategories = await fetchAllCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        logger.error('Error loading categories:', error);
        toast({
          title: "Warning",
          description: "Could not load categories for validation. Import will still work but categories won't be mapped.",
          variant: "destructive",
        });
      } finally {
        setLoadingCategories(false);
      }
    }
  };

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
      const row: Record<string, unknown> = {};
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
    setImportResults({ successful: 0, failed: 0, errors: [], categoryIssues: [] });

    try {
      // Parse Excel file
      const rawData = await parseExcelFile(importFile);
      // Require at least a few expected inventory headers
      const candidate = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null;
      const expectedAnyOf = ["name", "item_name", "item", "product_name"];
      const hasNameLike = candidate && typeof candidate === 'object'
        ? expectedAnyOf.some(h => Object.prototype.hasOwnProperty.call(candidate, h))
        : false;
      if (!hasNameLike) {
        throw new Error("Invalid or missing headers. Expect a name column like 'name' or 'item_name'.");
      }
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('No valid data found in file');
      }

      setImportProgress(25);

      // Validate category data
      const { validItems, invalidItems, missingCategories } = validateCategoryData(rawData, categories);
      
      setImportProgress(50);

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];
      const categoryIssues: string[] = [];
      const importedItems: unknown[] = [];

      // Process invalid items first (add to errors)
      invalidItems.forEach(item => {
        failed++;
        errors.push(`Row ${item.rowIndex}: ${item.error}`);
      });

      // Add category issues summary
      if (missingCategories.length > 0) {
        categoryIssues.push(`Missing categories: ${missingCategories.join(', ')}`);
        categoryIssues.push(`Items with missing categories will not be imported.`);
      }

      // Process valid items
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        setImportProgress(50 + ((i + 1) / validItems.length) * 40);

        try {
          const processedItem = {
            name: item.name,
            quantity: item.quantity,
            description: item.description,
            minimum_quantity: item.minimum_quantity,
            unit: item.unit,
            location_details: item.location_details,
            preferred_vendor: item.preferred_vendor,
            notes: item.notes,
            status: item.status || 'active',
            category_id: item.category_id
          };

          importedItems.push(processedItem);
          successful++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${item.rowIndex}: ${errorMessage}`);
        }
      }

      setImportResults({ successful, failed, errors, categoryIssues });

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
      logger.error('Import error:', error);
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
    <Dialog open={open} onOpenChange={handleDialogOpen}>
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

                {/* Category Information */}
                {categories.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Available Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {categories.map(category => (
                            <Badge key={category.id} variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use these exact category names in your Excel file, or leave empty for 'General'
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {loadingCategories && (
                  <div className="text-sm text-muted-foreground">
                    Loading categories for validation...
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Flexible Field Mapping</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    The import supports various column names. For example:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Name:</strong> "name", "item_name", "item", "product_name"</li>
                    <li>• <strong>Quantity:</strong> "quantity", "qty", "amount", "stock"</li>
                    <li>• <strong>Minimum:</strong> "minimum_quantity", "min_quantity", "minimum", "reorder_level"</li>
                    <li>• <strong>Category:</strong> "category", "category_name", "type"</li>
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
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
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
                      {importResults.categoryIssues.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Category Issues:</p>
                              {importResults.categoryIssues.map((issue, index) => (
                                <p key={index} className="text-sm">{issue}</p>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
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
