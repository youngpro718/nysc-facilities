
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LayoutGrid, LayoutList, RefreshCw, RotateCw } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  view: "grid" | "list";
  onViewChange: (value: "grid" | "list") => void;
  onRefresh: () => void;
  cardType?: "standard" | "flippable";
  onCardTypeChange?: (type: "standard" | "flippable") => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  view,
  onViewChange,
  onRefresh,
  cardType = "standard",
  onCardTypeChange
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between">
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-[300px]"
        />
        <div className="flex gap-3">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="number_asc">Room # (asc)</SelectItem>
                <SelectItem value="number_desc">Room # (desc)</SelectItem>
                <SelectItem value="updated_at_desc">Last Updated</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {view === "grid" && onCardTypeChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCardTypeChange(cardType === "standard" ? "flippable" : "standard")}
            title={cardType === "standard" ? "Switch to flippable cards" : "Switch to standard cards"}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            {cardType === "standard" ? "Flippable" : "Standard"}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewChange(view === "grid" ? "list" : "grid")}
          title={view === "grid" ? "Switch to list view" : "Switch to grid view"}
        >
          {view === "grid" ? (
            <LayoutList className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          title="Refresh room list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
