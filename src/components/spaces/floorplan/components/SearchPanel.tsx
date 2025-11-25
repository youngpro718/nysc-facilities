import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  results?: SearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
  // Legacy compatibility (ModernFloorPlanView usage)
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  filterType?: 'all' | 'room' | 'hallway' | 'door';
  onFilterTypeChange?: (t: 'all' | 'room' | 'hallway' | 'door') => void;
  objects?: any[];
  onObjectSelect?: (obj: any) => void;
}

// Strong types for search results
export interface SearchResult {
  id: string;
  type: string;
  name?: string;
  label?: string;
  description?: string;
}

// Helper: validate result shape
const isValidResult = (r: any): r is SearchResult => {
  return (
    r && typeof r === 'object' && typeof r.id === 'string' && typeof r.type === 'string'
  );
};

// Helper: highlight matched text
const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-600 rounded px-0.5">{match}</mark>
      {after}
    </>
  );
};

export function SearchPanel({ 
  onSearch, 
  onClear, 
  results = [], 
  isOpen, 
  onClose,
  onSelect,
  // legacy API
  searchQuery,
  onSearchQueryChange,
  filterType = 'all',
  onFilterTypeChange,
  objects,
  onObjectSelect,
}: SearchPanelProps) {
  const [query, setQuery] = useState(searchQuery ?? '');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Debounce search to reduce load
  useEffect(() => {
    const handle = setTimeout(() => {
      // Prefer new onSearch if provided by caller; otherwise propagate through legacy handler
      if (onSearch) onSearch(query);
      if (onSearchQueryChange) onSearchQueryChange(query);
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Keep local query in sync with external searchQuery when panel is reopened or external changes
  useEffect(() => {
    if (typeof searchQuery === 'string') setQuery(searchQuery);
  }, [searchQuery, isOpen]);

  const handleSearch = (value: string) => {
    setQuery(value);
    // onSearch is debounced via useEffect
  };

  const handleClear = () => {
    setQuery('');
    onClear();
    setActiveIndex(-1);
  };

  if (!isOpen) return null;

  // Derive results from objects (legacy mode) when results prop is not provided by parent
  const derivedResults = useMemo<SearchResult[]>(() => {
    if (!Array.isArray(objects)) return [];
    const q = (query || '').toLowerCase().trim();
    return objects
      .filter((obj: any) => {
        if (!obj) return false;
        if (filterType !== 'all' && obj?.type !== filterType) return false;
        if (!q) return true;
        const name = String(obj?.data?.properties?.label || obj?.data?.name || obj?.name || '').toLowerCase();
        const desc = String(obj?.data?.properties?.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
      .map((obj: any) => ({
        id: String(obj.id),
        type: String(obj.type || 'room'),
        name: String(obj?.data?.properties?.label || obj?.data?.name || obj?.name || obj.id),
        label: undefined,
        description: obj?.data?.properties?.description,
      }));
  }, [objects, query, filterType]);

  const safeResults = useMemo(() => {
    const incoming = Array.isArray(results) && results.length ? results : derivedResults;
    return incoming.filter(isValidResult);
  }, [results, derivedResults]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else if (onObjectSelect && Array.isArray(objects)) {
      const match = objects.find((o: any) => String(o?.id) === result.id);
      if (match) onObjectSelect(match);
    }
    onClose();
    // keep query visible; caller may choose to clear
  }, [onClose, onSelect]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!safeResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % safeResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + safeResults.length) % safeResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const res = safeResults[activeIndex] ?? safeResults[0];
      if (res) handleSelect(res);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute top-16 right-4 z-50 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Search Spaces</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search rooms, hallways, doors..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={onKeyDown}
            className="pl-9 pr-8"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {query && (
        <div className="p-4 max-h-64 overflow-y-auto">
          {safeResults.length > 0 ? (
            <div className="space-y-2">
              {safeResults.map((result, idx) => (
                <div
                  key={result.id}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'p-3 rounded-md cursor-pointer transition-colors',
                    idx === activeIndex
                      ? 'bg-slate-100 dark:bg-slate-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {highlightMatch(result.name || result.label || '', query)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {result.type}
                    </Badge>
                  </div>
                  {result.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {highlightMatch(result.description, query)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
