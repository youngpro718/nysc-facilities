// @ts-nocheck
/**
 * AuditTrail Component
 * 
 * Displays a timeline of audit log entries for a specific record
 * Shows who made changes, when, and what changed
 * 
 * @module components/operations/AuditTrail
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuditTrail } from '@/hooks/operations/useAuditTrail';
import { DataState } from '@/ui/DataState';
import type { AuditLogEntry } from '@/types/operations';

interface AuditTrailProps {
  tableName: string;
  recordId: string;
  limit?: number;
  className?: string;
}

// Helper to get action from entry (handles both 'action' and 'operation' fields)
const getEntryAction = (entry: AuditLogEntry): 'INSERT' | 'UPDATE' | 'DELETE' => {
  return entry.action || entry.operation;
};

export function AuditTrail({ 
  tableName, 
  recordId, 
  limit = 20,
  className 
}: AuditTrailProps) {
  const { data: auditEntries, isLoading, error } = useAuditTrail(tableName, recordId, limit);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, unknown> = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
    };
    return variants[action] || 'outline';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getChangedFields = (entry: AuditLogEntry): string[] => {
    const action = getEntryAction(entry);
    if (action === 'INSERT') return Object.keys(entry.new_values || {});
    if (action === 'DELETE') return Object.keys(entry.old_values || {});
    
    // For UPDATE, find fields that changed
    const oldVals = entry.old_values || {};
    const newVals = entry.new_values || {};
    const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
    
    return Array.from(allKeys).filter(key => 
      JSON.stringify(oldVals[key]) !== JSON.stringify(newVals[key])
    );
  };

  const formatFieldChange = (entry: AuditLogEntry, field: string) => {
    const oldVal = entry.old_values?.[field];
    const newVal = entry.new_values?.[field];
    const action = getEntryAction(entry);

    if (action === 'INSERT') {
      return <span className="text-green-600 dark:text-green-400">{JSON.stringify(newVal)}</span>;
    }
    
    if (action === 'DELETE') {
      return <span className="text-red-600 dark:text-red-400 line-through">{JSON.stringify(oldVal)}</span>;
    }

    return (
      <span>
        <span className="text-red-600 dark:text-red-400 line-through">{JSON.stringify(oldVal)}</span>
        {' → '}
        <span className="text-green-600 dark:text-green-400">{JSON.stringify(newVal)}</span>
      </span>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataState
          data={auditEntries}
          isLoading={isLoading}
          error={error}
          emptyState={{
            title: 'No audit history',
            description: 'No changes have been recorded for this item yet.',
          }}
          loadingSkeleton={
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          {(entries) => (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {entries.map((entry: AuditLogEntry, index: number) => {
                  const changedFields = getChangedFields(entry);
                  const isLast = index === entries.length - 1;
                  const action = getEntryAction(entry);

                  return (
                    <div key={entry.id} className="relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                      )}

                      <div className="flex gap-3">
                        {/* Action icon */}
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background">
                          {getActionIcon(action)}
                        </div>

                        {/* Entry content */}
                        <div className="flex-1 space-y-2 pb-4">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getActionBadge(action)}>
                              {action}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(entry.created_at)}
                            </span>
                            {entry.user_id && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                User {entry.user_id.slice(0, 8)}
                              </span>
                            )}
                          </div>

                          {/* Changed fields */}
                          {changedFields.length > 0 && (
                            <div className="space-y-1 text-sm">
                              {changedFields.map((field) => (
                                <div key={field} className="flex gap-2">
                                  <span className="font-medium text-muted-foreground min-w-[100px]">
                                    {field}:
                                  </span>
                                  <span className="flex-1 font-mono text-xs">
                                    {formatFieldChange(entry, field)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DataState>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version of AuditTrail for inline display
 */
export function AuditTrailCompact({ 
  tableName, 
  recordId, 
  limit = 5 
}: AuditTrailProps) {
  const { data: auditEntries, isLoading, error } = useAuditTrail(tableName, recordId, limit);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load audit trail</AlertDescription>
      </Alert>
    );
  }

  if (!auditEntries || auditEntries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No recent changes
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {auditEntries.map((entry: AuditLogEntry) => {
        const action = getEntryAction(entry);
        return (
          <div key={entry.id} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {action}
            </Badge>
            <span className="text-muted-foreground">
              {formatTimestamp(entry.created_at)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
