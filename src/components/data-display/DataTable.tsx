
import { ResponsiveTable, ResponsiveTableColumn } from "@/components/ui/responsive-table";

interface DataTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  // Mobile-specific props
  getItemKey?: (item: T, index: number) => string;
  getItemTitle?: (item: T) => string;
  getItemSubtitle?: (item: T) => string;
  onItemClick?: (item: T) => void;
}

export function DataTable<T>({ 
  columns, 
  data, 
  emptyMessage = "No data available", 
  isLoading,
  className,
  getItemKey,
  getItemTitle,
  getItemSubtitle,
  onItemClick
}: DataTableProps<T>) {
  return (
    <ResponsiveTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      className={className}
      getItemKey={getItemKey}
      getItemTitle={getItemTitle}
      getItemSubtitle={getItemSubtitle}
      onItemClick={onItemClick}
    />
  );
}
