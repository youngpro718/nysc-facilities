
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface SearchResultsInfoProps {
  totalCount: number;
  filteredCount: number;
  searchQuery?: string;
  roomTypeCounts?: Record<string, number>;
}

export function SearchResultsInfo({ 
  totalCount, 
  filteredCount, 
  searchQuery,
  roomTypeCounts = {}
}: SearchResultsInfoProps) {
  const isFiltered = totalCount !== filteredCount;
  const hasRoomTypeCounts = Object.keys(roomTypeCounts).length > 0;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <span>
        Showing <strong>{filteredCount}</strong> {filteredCount === 1 ? 'room' : 'rooms'}
        {isFiltered && <> out of <strong>{totalCount}</strong> total</>}
        {searchQuery && <> for "<span className="font-medium">{searchQuery}</span>"</>}
      </span>
      
      {hasRoomTypeCounts && (
        <div className="flex flex-wrap gap-2 ml-2">
          {Object.entries(roomTypeCounts).map(([type, count]) => (
            count > 0 && (
              <Badge key={type} variant="outline" className="text-xs">
                {type}: {count}
              </Badge>
            )
          ))}
        </div>
      )}
    </div>
  );
}
