import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, MoreVertical, Plus, Download, Upload } from "lucide-react";

interface MobileInventoryHeaderProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddItem: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  itemCount: number;
}

export function MobileInventoryHeader({
  onExport,
  onImport,
  onAddItem,
  searchQuery,
  onSearchChange,
  itemCount,
}: MobileInventoryHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inventory</h3>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader>
                <SheetTitle>Inventory Actions</SheetTitle>
                <SheetDescription>
                  Import, export, and manage your inventory
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 py-4">
                <Button 
                  variant="outline" 
                  onClick={onExport}
                  className="justify-start h-12"
                >
                  <Download className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Export to Excel</div>
                    <div className="text-sm text-muted-foreground">Download current inventory</div>
                  </div>
                </Button>
                
                <Button variant="outline" asChild className="justify-start h-12">
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Import from Excel</div>
                      <div className="text-sm text-muted-foreground">Upload inventory data</div>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={onImport}
                    />
                  </label>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>
    </div>
  );
}