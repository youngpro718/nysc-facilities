
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  columns: {
    id: string;
    header: React.ReactNode;
    cell: (item: T) => React.ReactNode;
    className?: string;
  }[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({ 
  columns, 
  data, 
  emptyMessage = "No data available", 
  isLoading,
  className
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <td colSpan={columns.length} className="h-24 text-center">
                Loading...
              </td>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <td colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </td>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.id}`} className="p-4">
                    {column.cell(item)}
                  </td>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
