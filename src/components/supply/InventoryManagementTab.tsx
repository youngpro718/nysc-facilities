import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  TrendingDown,
  Edit,
  Boxes,
  RefreshCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { InventoryActivityLog } from './InventoryActivityLog';
import { InventoryAdjustmentDialog } from './InventoryAdjustmentDialog';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  category: string;
  location: string;
  last_restocked: string;
}

export function InventoryManagementTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'low' | 'out'>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch inventory items
  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    },
    refetchInterval: 30000,
    staleTime: 0, // Always consider data stale to get fresh updates
  });

  // Filter items
  const filteredItems = (items || []).filter(item => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Filter by stock level - FIXED LOGIC
    if (filterView === 'low') {
      // Low stock = BELOW minimum (not at minimum)
      return item.quantity > 0 && item.quantity < item.minimum_quantity;
    } else if (filterView === 'out') {
      return item.quantity === 0;
    }

    return true;
  });

  // Calculate stats - FIXED LOGIC
  const totalItems = items?.length || 0;
  // Low stock = BELOW minimum (not at or below)
  const lowStockItems = items?.filter(i => i.quantity > 0 && i.quantity < i.minimum_quantity).length || 0;
  const outOfStockItems = items?.filter(i => i.quantity === 0).length || 0;

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'out';
    // FIXED: Low stock only if BELOW minimum, not at minimum
    if (item.quantity < item.minimum_quantity) return 'low';
    return 'good';
  };

  const getStockBadge = (item: InventoryItem) => {
    const status = getStockStatus(item);
    
    if (status === 'out') {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (status === 'low') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge variant="outline">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Urgent reorder
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterView === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterView('all')}
            size="sm"
          >
            All Items
          </Button>
          <Button
            variant={filterView === 'low' ? 'default' : 'outline'}
            onClick={() => setFilterView('low')}
            size="sm"
          >
            Low Stock ({lowStockItems})
          </Button>
          <Button
            variant={filterView === 'out' ? 'default' : 'outline'}
            onClick={() => setFilterView('out')}
            size="sm"
          >
            Out of Stock ({outOfStockItems})
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No items found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      {getStockBadge(item)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>SKU: {item.sku || 'N/A'}</span>
                      <span>Category: {item.category || 'Uncategorized'}</span>
                      <span>Location: {item.location || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {item.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.unit || 'units'}
                      </div>
                      {item.minimum_quantity && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Min: {item.minimum_quantity}
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Adjust
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && filterView === 'all' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">
                  {lowStockItems} item{lowStockItems !== 1 ? 's' : ''} running low on stock
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider reordering these items soon to avoid stockouts.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterView('low')}
                className="border-yellow-300"
              >
                View Low Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Out of Stock Alert */}
      {outOfStockItems > 0 && filterView === 'all' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900">
                  {outOfStockItems} item{outOfStockItems !== 1 ? 's' : ''} out of stock
                </p>
                <p className="text-sm text-red-700 mt-1">
                  These items need immediate reordering.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterView('out')}
                className="border-red-300"
              >
                View Out of Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <InventoryActivityLog limit={20} />

      {/* Adjustment Dialog */}
      <InventoryAdjustmentDialog
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
