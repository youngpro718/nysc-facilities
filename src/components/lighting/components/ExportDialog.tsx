import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { toast } from "sonner";

interface ExportDialogProps {
  fixtures: LightingFixture[];
  selectedFixtures: string[];
}

export function ExportDialog({ fixtures, selectedFixtures }: ExportDialogProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const selectedFixtureData = fixtures.filter(f => selectedFixtures.includes(f.id));
      
      if (format === 'csv') {
        const headers = ["Name", "Type", "Status", "Space", "Position", "Technology", "Bulb Count", "Zone"];
        const csvContent = [
          headers.join(","),
          ...selectedFixtureData.map(fixture => [
            `"${fixture.name}"`,
            fixture.type,
            fixture.status,
            `"${fixture.space_name || 'N/A'}"`,
            fixture.position,
            fixture.technology || 'N/A',
            fixture.bulb_count,
            `"${fixture.zone_name || 'No Zone'}"`
          ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `lighting-fixtures-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const jsonContent = JSON.stringify(selectedFixtureData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `lighting-fixtures-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success(`Exported ${selectedFixtures.length} fixtures as ${format.toUpperCase()}`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to export fixtures");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export ({selectedFixtures.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Fixtures</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export {selectedFixtures.length} selected fixtures in your preferred format.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => handleExport('csv')} className="flex-1">
              Export as CSV
            </Button>
            <Button onClick={() => handleExport('json')} variant="outline" className="flex-1">
              Export as JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}