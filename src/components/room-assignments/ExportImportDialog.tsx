import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  FileText, 
  Table,
  CheckCircle2,
  AlertTriangle,
  File
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExportImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: any[];
  onImportSuccess: () => void;
}

export function ExportImportDialog({
  isOpen,
  onClose,
  assignments,
  onImportSuccess
}: ExportImportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [exportFields, setExportFields] = useState({
    occupant_name: true,
    occupant_email: true,
    department: true,
    room_number: true,
    room_name: true,
    building_name: true,
    floor_name: true,
    assignment_type: true,
    is_primary: true,
    assigned_at: true,
    schedule: false,
    notes: false
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  }>({ successful: 0, failed: 0, errors: [] });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    if (!assignments.length) {
      toast.error('No assignments to export');
      return;
    }

    setIsProcessing(true);
    
    try {
      const selectedFields = Object.entries(exportFields)
        .filter(([_, selected]) => selected)
        .map(([field]) => field);

      const exportData = assignments.map(assignment => {
        const row: any = {};
        selectedFields.forEach(field => {
          row[field] = assignment[field] || '';
        });
        return row;
      });

      let blob: Blob;
      let filename: string;

      switch (exportFormat) {
        case 'csv': {
          const csvContent = convertToCSV(exportData);
          blob = new Blob([csvContent], { type: 'text/csv' });
          filename = `room-assignments-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
        case 'json': {
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          filename = `room-assignments-${new Date().toISOString().split('T')[0]}.json`;
          break;
        }
        case 'excel': {
          // For Excel, we'll export as CSV for now (would need additional library for true Excel format)
          const excelContent = convertToCSV(exportData);
          blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
          filename = `room-assignments-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
        default: {
          throw new Error('Unsupported export format');
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} assignments`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setImportResults({ successful: 0, failed: 0, errors: [] });

    try {
      const text = await importFile.text();
      let importData: any[];

      if (importFile.name.endsWith('.json')) {
        importData = JSON.parse(text);
      } else {
        // Parse CSV
        importData = parseCSV(text);
      }

      if (!Array.isArray(importData)) {
        throw new Error('Invalid file format');
      }

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < importData.length; i++) {
        const row = importData[i];
        setImportProgress((i / importData.length) * 100);

        try {
          // Validate required fields
          if (!row.occupant_email || !row.room_number) {
            throw new Error('Missing required fields: occupant_email and room_number');
          }

          // Find occupant by email
          const { data: occupantData, error: occupantError } = await supabase
            .from('occupants')
            .select('id')
            .eq('email', row.occupant_email)
            .single();

          if (occupantError || !occupantData) {
            throw new Error(`Occupant not found: ${row.occupant_email}`);
          }

          // Find room by room number
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_number', row.room_number)
            .single();

          if (roomError || !roomData) {
            throw new Error(`Room not found: ${row.room_number}`);
          }

          // Create assignment
          const { error: insertError } = await supabase
            .from('occupant_room_assignments')
            .insert({
              occupant_id: occupantData.id,
              room_id: roomData.id,
              assignment_type: row.assignment_type || 'general',
              is_primary: row.is_primary === 'true' || row.is_primary === true,
              schedule: row.schedule || null,
              notes: row.notes || null
            });

          if (insertError) {
            throw insertError;
          }

          successful++;
        } catch (error) {
          failed++;
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportResults({ successful, failed, errors });
      setImportProgress(100);

      if (successful > 0) {
        toast.success(`Successfully imported ${successful} assignments`);
        onImportSuccess();
      }

      if (failed > 0) {
        toast.error(`Failed to import ${failed} assignments`);
      }

    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed: Invalid file format');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return data;
  };

  const handleFieldToggle = (field: string) => {
    setExportFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export / Import Assignments</DialogTitle>
          <DialogDescription>
            Export current assignments or import new ones from a file
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card className="p-4">
              <Label className="text-sm font-medium">Export Format</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: 'csv', label: 'CSV', icon: Table },
                  { value: 'json', label: 'JSON', icon: FileText },
                  { value: 'excel', label: 'Excel', icon: File }
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={exportFormat === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat(value as any)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <Label className="text-sm font-medium">Export Fields</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(exportFields).map(([field, selected]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={selected}
                      onCheckedChange={() => handleFieldToggle(field)}
                    />
                    <Label htmlFor={field} className="text-sm">
                      {field.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline">
                  {assignments.length} assignments available
                </Badge>
              </div>
              <Button onClick={handleExport} disabled={isProcessing}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card className="p-4">
              <Label className="text-sm font-medium">Import File</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />
              </div>
              {importFile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {importFile.name} ({Math.round(importFile.size / 1024)}KB)
                </div>
              )}
            </Card>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing assignments...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {importResults.successful > 0 || importResults.failed > 0 ? (
              <Card className="p-4">
                <div className="space-y-3">
                  {importResults.successful > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {importResults.successful} assignments imported successfully
                    </div>
                  )}
                  {importResults.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {importResults.failed} assignments failed
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
                </div>
              </Card>
            ) : null}

            <div className="flex justify-end">
              <Button 
                onClick={handleImport} 
                disabled={!importFile || isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}