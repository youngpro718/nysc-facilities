import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  label: string;
  value: string;
  type?: string;
}

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
  onClearRecent?: () => void;
  showFilters?: boolean;
  onFiltersClick?: () => void;
  filterCount?: number;
  className?: string;
}

export function MobileSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  suggestions = [],
  recentSearches = [],
  onRecentSearchSelect,
  onClearRecent,
  showFilters = false,
  onFiltersClick,
  filterCount = 0,
  className
}: MobileSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(s => 
    s.label.toLowerCase().includes(value.toLowerCase()) ||
    s.value.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 5);

  const shouldShowDropdown = isFocused && (
    (value.length > 0 && filteredSuggestions.length > 0) ||
    (value.length === 0 && recentSearches.length > 0)
  );

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className="pl-10 pr-10 h-11"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-8 w-8 p-0 -translate-y-1/2"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <Button
            variant="outline"
            size="default"
            className="h-11 px-3 relative"
            onClick={onFiltersClick}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {filterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Search Suggestions/Recent Searches Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
          {value.length === 0 && recentSearches.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
                {onClearRecent && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={onClearRecent}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      onChange(search);
                      onRecentSearchSelect?.(search);
                      setIsFocused(false);
                    }}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {value.length > 0 && filteredSuggestions.length > 0 && (
            <div className="py-1">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                  onClick={() => {
                    onChange(suggestion.value);
                    setIsFocused(false);
                  }}
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span>{suggestion.label}</span>
                  {suggestion.type && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {suggestion.type}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}