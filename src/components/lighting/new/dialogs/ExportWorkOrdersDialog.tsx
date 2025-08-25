import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { Download, FileText, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

interface ExportWorkOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportWorkOrdersDialog({ open, onOpenChange }: ExportWorkOrdersDialogProps) {
  const { fixtures } = useLightingFixtures();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    functional: false,
    maintenance_needed: true,
    non_functional: true,
    scheduled_replacement: true,
    emergency_only: false,
    requires_electrician: true
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const filteredFixtures = fixtures?.filter(fixture => {
    let matches = false;
    
    // Check status filters
    if (includeOptions.functional && fixture.status === 'functional') matches = true;
    if (includeOptions.maintenance_needed && fixture.status === 'maintenance_needed') matches = true;
    if (includeOptions.non_functional && fixture.status === 'non_functional') matches = true;
    if (includeOptions.scheduled_replacement && fixture.status === 'scheduled_replacement') matches = true;
    
    // If no status filters are selected, include all
    if (!includeOptions.functional && !includeOptions.maintenance_needed && 
        !includeOptions.non_functional && !includeOptions.scheduled_replacement) {
      matches = true;
    }
    
    // Apply additional filters
    if (matches && includeOptions.emergency_only && fixture.type !== 'emergency') {
      matches = false;
    }
    
    if (matches && includeOptions.requires_electrician && !fixture.requires_electrician) {
      matches = false;
    }
    
    return matches;
  }) || [];

  const handleExport = async () => {
    if (filteredFixtures.length === 0) {
      toast.error("No fixtures match the selected criteria");
      return;
    }

    setIsExporting(true);
    
    // Simulate export process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would generate and download the file
      const fileName = `lighting_work_orders_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      
      toast.success(`Work orders exported to ${fileName}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to export work orders");
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', icon: FileText },
    { value: 'excel', label: 'Excel Spreadsheet', icon: Download },
    { value: 'csv', label: 'CSV Data', icon: Download }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Work Orders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h4 className="font-medium">Export Format</h4>
                <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel' | 'csv') => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Include Fixtures
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="functional"
                      checked={includeOptions.functional}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, functional: !!checked }))
                      }
                    />
                    <label htmlFor="functional" className="text-sm">Functional</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maintenance_needed"
                      checked={includeOptions.maintenance_needed}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, maintenance_needed: !!checked }))
                      }
                    />
                    <label htmlFor="maintenance_needed" className="text-sm">Maintenance Needed</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="non_functional"
                      checked={includeOptions.non_functional}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, non_functional: !!checked }))
                      }
                    />
                    <label htmlFor="non_functional" className="text-sm">Non-Functional</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduled_replacement"
                      checked={includeOptions.scheduled_replacement}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, scheduled_replacement: !!checked }))
                      }
                    />
                    <label htmlFor="scheduled_replacement" className="text-sm">Scheduled Replacement</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emergency_only"
                      checked={includeOptions.emergency_only}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, emergency_only: !!checked }))
                      }
                    />
                    <label htmlFor="emergency_only" className="text-sm">Emergency Only</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_electrician"
                      checked={includeOptions.requires_electrician}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, requires_electrician: !!checked }))
                      }
                    />
                    <label htmlFor="requires_electrician" className="text-sm">Requires Electrician</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm">
                <strong>{filteredFixtures.length}</strong> fixtures match the selected criteria
              </div>
              {filteredFixtures.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  This will generate work orders for all matching fixtures with their current status, location, and maintenance requirements.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || filteredFixtures.length === 0}
            >
              {isExporting ? 'Exporting...' : `Export ${filteredFixtures.length} Work Orders`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}