import { Button } from "@/components/ui/button";
import { CreateLightingDialog } from "../CreateLightingDialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { RefreshCw, CheckSquare, XSquare, Download, Layers } from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { AssignZoneDialog } from "./AssignZoneDialog";
import { useLightingAuditorExport } from "@/hooks/reports/useReporting";
import type { LightingAuditorReportOptions } from "@/services/reports/reportGenerationService";

export interface LightingHeaderProps {
  selectedFixtures: string[];
  fixtures: LightingFixture[] | undefined;
  onSelectAll: () => void;
  onBulkStatusUpdate?: (status: LightingFixture['status']) => void;
  onBulkDelete: () => void;
  onFixtureCreated: () => void;
  showTitle?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

export const LightingHeader = ({
  selectedFixtures,
  fixtures,
  onSelectAll,
  onBulkStatusUpdate,
  onBulkDelete,
  onFixtureCreated,
  showTitle = true,
  onRefresh,
  isRefreshing = false,
  lastUpdated = null,
}: LightingHeaderProps) => {
  const { exportAndDownload, isExporting } = useLightingAuditorExport();
  const formatUpdated = (d: Date | null) => {
    if (!d) return "";
    const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'json', scope: 'filtered' | 'selected') => {
    if (!fixtures || fixtures.length === 0) return;
    const options: LightingAuditorReportOptions = {
      format,
      fixtures,
      selectedFixtureIds: scope === 'selected' ? selectedFixtures : undefined,
    };
    await exportAndDownload(options);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      {showTitle && (
        <h1 className="text-2xl font-bold">Lighting Management</h1>
      )}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <>
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`${isRefreshing ? 'animate-spin ' : ''}h-4 w-4`} />
              Refresh
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated {formatUpdated(lastUpdated)}
            </span>
          </>
        )}
        {/* Export filtered fixtures */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!fixtures || fixtures.length === 0 || isExporting} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('csv', 'filtered')} disabled={!fixtures || fixtures.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Filtered as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf', 'filtered')} disabled={!fixtures || fixtures.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Filtered as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json', 'filtered')} disabled={!fixtures || fixtures.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Filtered as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedFixtures.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="flex items-center gap-2"
            >
              {selectedFixtures.length === fixtures?.length ? (
                <XSquare className="h-4 w-4" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
              {selectedFixtures.length === fixtures?.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            <AssignZoneDialog 
              selectedFixtures={selectedFixtures}
              onComplete={onFixtureCreated}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedFixtures.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onBulkStatusUpdate && (
                  <>
                    <DropdownMenuItem onClick={() => onBulkStatusUpdate('functional')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Mark as Functional
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkStatusUpdate('maintenance_needed')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Mark as Needs Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onBulkDelete}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv', 'selected')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf', 'selected')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json', 'selected')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <CreateLightingDialog 
          onFixtureCreated={onFixtureCreated} 
          onZoneCreated={onFixtureCreated}
        />
      </div>
    </div>
  );
};

