import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Calendar,
  User,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface InventoryTransaction {
  id: string;
  transaction_type: 'addition' | 'removal' | 'adjustment' | 'audit';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  performed_by: string;
  performed_by_name?: string;
  created_at: string;
  item_id: string;
  item_name: string;
  category_name?: string;
}

interface AuditSummary {
  total_transactions: number;
  additions: number;
  removals: number;
  adjustments: number;
  audits: number;
  total_value_change: number;
  recent_activity: number;
}

export function InventoryAuditsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('transactions');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch inventory transactions (flat), then hydrate item/user/category via batched lookups
  const { data: transactions = [], isLoading: transactionsLoading, isError: txErrorFlag, error: txError } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: async (): Promise<InventoryTransaction[]> => {
      // 1) Base transactions (use * to avoid column mismatch across environments)
      const { data: txData, error: baseErr } = await supabase
        .from('inventory_item_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (baseErr) throw baseErr;

      const itemIds = Array.from(new Set((txData || []).map(t => t.item_id).filter(Boolean)));
      const userIds = Array.from(new Set((txData || []).map(t => t.performed_by).filter(Boolean)));

      // 2) Items (name, category)
      const { data: items, error: itemsErr } = await supabase
        .from('inventory_items')
        .select('id, name, category_id')
        .in('id', itemIds.length ? itemIds : ['00000000-0000-0000-0000-000000000000']);
      if (itemsErr) throw itemsErr;

      const categoryIds = Array.from(new Set((items || []).map(i => i.category_id).filter(Boolean)));
      const { data: categories, error: catsErr } = await supabase
        .from('inventory_categories')
        .select('id, name')
        .in('id', categoryIds.length ? categoryIds : ['00000000-0000-0000-0000-000000000000']);
      if (catsErr) throw catsErr;

      // 3) Users
      const { data: users, error: usersErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
      if (usersErr) throw usersErr;

      const itemsById = new Map((items || []).map((i: Record<string, unknown>) => [i.id, i]));
      const catsById = new Map((categories || []).map((c: Record<string, unknown>) => [c.id, c]));
      const usersById = new Map((users || []).map((u: Record<string, unknown>) => [u.id, u]));

      const hydrated = (txData || []).map((t: Record<string, unknown>) => {
        const item = itemsById.get(t.item_id);
        const cat = item ? catsById.get(((item as Record<string, unknown>)).category_id) : undefined;
        const user = usersById.get(t.performed_by);
        return {
          id: t.id,
          transaction_type: t.transaction_type,
          quantity: t.quantity,
          previous_quantity: t.previous_quantity ?? t.quantity,
          new_quantity: t.new_quantity ?? t.quantity,
          reason: t.reason ?? '',
          performed_by: t.performed_by,
          performed_by_name: user ? `${((user as Record<string, unknown>)).first_name} ${((user as Record<string, unknown>)).last_name}` : 'Unknown User',
          created_at: t.created_at,
          item_id: t.item_id,
          item_name: (item as Record<string, unknown>)?.name ?? 'Unknown Item',
          category_name: (cat as Record<string, unknown>)?.name,
        } as InventoryTransaction;
      });

      logger.debug('[InventoryAuditsPanel] hydrated', { count: hydrated.length });
      return hydrated;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Calculate audit summary
  const auditSummary: AuditSummary = React.useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const additions = transactions.filter(t => t.transaction_type === 'addition').length;
    const removals = transactions.filter(t => t.transaction_type === 'removal').length;
    const adjustments = transactions.filter(t => t.transaction_type === 'adjustment').length;
    const audits = transactions.filter(t => t.transaction_type === 'audit').length;
    
    const totalValueChange = transactions.reduce((sum, t) => {
      if (t.transaction_type === 'addition') return sum + t.quantity;
      if (t.transaction_type === 'removal') return sum - t.quantity;
      return sum + (t.new_quantity - t.previous_quantity);
    }, 0);

    const recentActivity = transactions.filter(t => 
      new Date(t.created_at) > oneDayAgo
    ).length;

    return {
      total_transactions: transactions.length,
      additions,
      removals,
      adjustments,
      audits,
      total_value_change: totalValueChange,
      recent_activity: recentActivity,
    };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.performed_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType]);

  const total = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, page, pageSize]);

  const exportCSV = () => {
    const rows = filteredTransactions.map(t => ({
      id: t.id,
      date: new Date(t.created_at).toISOString(),
      item_name: t.item_name,
      transaction_type: t.transaction_type,
      quantity: t.quantity,
      previous_quantity: t.previous_quantity,
      new_quantity: t.new_quantity,
      reason: t.reason,
      performed_by: t.performed_by_name ?? '',
      category_name: t.category_name ?? '',
    }));
    const header = Object.keys(rows[0] || {
      id: '', date: '', item_name: '', transaction_type: '', quantity: 0,
      previous_quantity: 0, new_quantity: 0, reason: '', performed_by: '', category_name: ''
    });
    const escape = (v: Record<string, unknown>) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [header.join(',')].concat(rows.map(r => header.map(k => escape(((r as Record<string, unknown>))[k])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_audits_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'removal':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'adjustment':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'audit':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'addition':
        return <Badge variant="default" className="bg-green-100 text-green-800">Addition</Badge>;
      case 'removal':
        return <Badge variant="default" className="bg-red-100 text-red-800">Removal</Badge>;
      case 'adjustment':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Adjustment</Badge>;
      case 'audit':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Audit</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (transactionsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inventory Audits</h3>
          <p className="text-sm text-muted-foreground">
            Track all inventory changes and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditSummary.total_transactions}</div>
            <p className="text-xs text-muted-foreground">
              {auditSummary.recent_activity} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Additions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{auditSummary.additions}</div>
            <p className="text-xs text-muted-foreground">
              Stock increases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Removals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{auditSummary.removals}</div>
            <p className="text-xs text-muted-foreground">
              Stock decreases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${auditSummary.total_value_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {auditSummary.total_value_change >= 0 ? '+' : ''}{auditSummary.total_value_change}
            </div>
            <p className="text-xs text-muted-foreground">
              Total quantity change
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="addition">Additions</option>
                <option value="removal">Removals</option>
                <option value="adjustment">Adjustments</option>
                <option value="audit">Audits</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-2 border rounded-md text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>
          {txErrorFlag && (
            <div className="mt-3 rounded border border-destructive/30 bg-destructive/10 text-destructive p-2 text-sm">
              Failed to load transactions: {String((txError as Record<string, unknown>)?.message || txError)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found matching your criteria.</p>
              </div>
            ) : (
              pageItems.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{transaction.item_name}</h4>
                        {getTransactionBadge(transaction.transaction_type)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.reason || 'No reason provided'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {transaction.performed_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                        {transaction.category_name && (
                          <span>Category: {transaction.category_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {transaction.previous_quantity} → {transaction.new_quantity}
                    </div>
                    <div className={`text-xs ${
                      transaction.transaction_type === 'addition' ? 'text-green-600' :
                      transaction.transaction_type === 'removal' ? 'text-red-600' :
                      'text-orange-600'
                    }`}>
                      {transaction.transaction_type === 'addition' ? '+' : 
                       transaction.transaction_type === 'removal' ? '-' : '±'}
                      {Math.abs(transaction.quantity)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* Pagination Controls */}
            {filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
                <div>
                  Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
                </div>
                <div className="flex items-center gap-2">
                  <Button disabled={page <= 1} variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                  <span>Page {page} of {totalPages}</span>
                  <Button disabled={page >= totalPages} variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
