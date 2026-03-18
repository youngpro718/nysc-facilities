import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface MobileFilterSheetProps {
  children: ReactNode;
  title?: string;
  description?: string;
  activeFilters?: FilterChip[];
  onClearFilter?: (filterId: string) => void;
  onClearAll?: () => void;
  filterCount?: number;
}

export function MobileFilterSheet({
  children,
  title = "Filters",
  description,
  activeFilters = [],
  onClearFilter,
  onClearAll,
  filterCount = 0
}: MobileFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative h-9">
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Filters</span>
          <span className="sm:hidden">Filter</span>
          {filterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {filterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            {title}
            {activeFilters.length > 0 && onClearAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearAll}
                className="text-xs h-8"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="py-4">
            <h4 className="text-sm font-medium mb-2">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge 
                  key={filter.id} 
                  variant="secondary" 
                  className="text-xs pr-1"
                >
                  {filter.label}: {filter.value}
                  {onClearFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => onClearFilter(filter.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="py-4 space-y-6">
            {children}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}