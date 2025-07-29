import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  results?: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ 
  onSearch, 
  onClear, 
  results = [], 
  isOpen, 
  onClose 
}: SearchPanelProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  if (!isOpen) return null;

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
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{result.name || result.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.type}
                    </Badge>
                  </div>
                  {result.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {result.description}
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
