
import React from 'react';
import { Card } from '@/components/ui/card';

export interface GridViewProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
  onDelete?: (id: string) => void;
  type?: string;
  renderItemContent?: (item: T) => React.ReactNode;
}

export function GridView<T>({ 
  items, 
  renderItem, 
  emptyMessage = "No items found",
  onDelete,
  type,
  renderItemContent
}: GridViewProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // If renderItemContent is provided, use it with renderItem function
  const renderFn = renderItemContent ? renderItemContent : renderItem;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <Card key={index} className="overflow-hidden shadow-sm hover:shadow transition-shadow">
          {renderFn(item)}
        </Card>
      ))}
    </div>
  );
}
