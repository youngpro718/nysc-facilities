import * as React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";

export interface ResponsiveTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  className?: string;
  // Mobile-specific properties
  mobileLabel?: string; // Label to show on mobile cards
  mobileHidden?: boolean; // Hide this column on mobile
  mobilePrimary?: boolean; // Show as primary info on mobile
  mobileSecondary?: boolean; // Show as secondary info on mobile
}

export interface ResponsiveTableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  // Mobile card properties
  getItemKey?: (item: T, index: number) => string;
  getItemTitle?: (item: T) => string;
  getItemSubtitle?: (item: T) => string;
  getItemBadges?: (item: T) => Array<{ label: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
  actions?: ResponsiveTableAction<T>[];
  onItemClick?: (item: T) => void;
}

export function ResponsiveTable<T>({ 
  columns, 
  data, 
  emptyMessage = "No data available", 
  isLoading,
  className,
  getItemKey = (_, index) => index.toString(),
  getItemTitle,
  getItemSubtitle,
  getItemBadges,
  actions = [],
  onItemClick
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        {isMobile ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-16"></div>
                      <div className="h-5 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="w-full overflow-auto">
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
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="animate-pulse">Loading...</div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {isMobile ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full overflow-auto">
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
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn("w-full space-y-3", className)}>
        {data.map((item, index) => {
          const key = getItemKey(item, index);
          const title = getItemTitle?.(item);
          const subtitle = getItemSubtitle?.(item);
          const badges = getItemBadges?.(item) || [];

          return (
            <Card 
              key={key} 
              className={cn(
                "transition-colors",
                onItemClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onItemClick?.(item)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h3 className="font-medium text-base leading-tight truncate mb-1">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  
                  {actions.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        // For now, just trigger the first action
                        // In a real implementation, you'd show an action sheet
                        if (actions[0]) {
                          actions[0].onClick(item);
                        }
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {badges.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {badges.map((badge, badgeIndex) => (
                      <Badge 
                        key={badgeIndex}
                        variant={badge.variant || "default"}
                        className="text-xs"
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Show mobile-specific column data */}
                <div className="space-y-2">
                  {columns
                    .filter(col => !col.mobileHidden && col.mobileLabel)
                    .map((column) => (
                      <div key={column.id} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">
                          {column.mobileLabel}:
                        </span>
                        <span className="text-right">
                          {column.cell(item)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Quick actions */}
                {actions.length > 1 && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    {actions.slice(0, 2).map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant={action.variant || "outline"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(item);
                        }}
                      >
                        {action.icon}
                        <span className="ml-1">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
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
            {actions.length > 0 && (
              <TableHead className="w-[100px]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const key = getItemKey(item, index);
            return (
              <TableRow 
                key={key}
                className={cn(
                  onItemClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onItemClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(item)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <div className="flex gap-1">
                      {actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant={action.variant || "ghost"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(item);
                          }}
                        >
                          {action.icon}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
