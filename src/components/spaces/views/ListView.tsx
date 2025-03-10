
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ListViewProps<T> {
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  headers: React.ReactNode;
  emptyMessage?: string;
}

export function ListView<T>({ 
  items, 
  renderRow, 
  headers,
  emptyMessage = "No items found" 
}: ListViewProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => renderRow(item))}
        </TableBody>
      </Table>
    </div>
  );
}
