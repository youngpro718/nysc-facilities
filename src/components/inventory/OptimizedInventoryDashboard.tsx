import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  TrendingDown,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Plus,
  BarChart3,
  Boxes,
  Activity,
  Clock
} from 'lucide-react';
import {
  useInventoryDashboardStats,
  useOptimizedInventoryItems,
  useLowStockItems,
  useInventoryCategories,
  useInventoryAnalytics,
  useDebouncedInventorySearch,
  useInventoryCacheManager
} from '@/hooks/optimized/useOptimizedInventory';

export function OptimizedInventoryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Optimized data hooks
  const { data: stats, isLoading: statsLoading } = useInventoryDashboardStats();
  const { data: allItems, isLoading: itemsLoading } = useOptimizedInventoryItems();
  const { data: lowStockItems, isLoading: lowStockLoading } = useLowStockItems();
  const { data: categories, isLoading: categoriesLoading } = useInventoryCategories();
  const { data: analytics, isLoading: analyticsLoading } = useInventoryAnalytics();
  const { data: searchResults, isLoading: searchLoading } = useDebouncedInventorySearch(searchQuery);
  
  // Cache management
  const { refreshAll, refreshDashboard } = useInventoryCacheManager();

  // Filtered items based on search and category
  const filteredItems = useMemo(() => {
    if (searchQuery.length >= 2) {
      return searchResults || [];
    }

    if (!allItems) return [];

    if (selectedCategory === 'all') {
      return allItems;
    }

    return allItems.filter(item => item.category_name === selectedCategory);
  }, [allItems, searchResults, searchQuery, selectedCategory]);

  // Loading state for main content
  const isLoading = statsLoading || itemsLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">
            Optimized inventory tracking and management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total_items || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across {stats?.categories_count || 0} categories
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total_value || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Items in stock
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.low_stock_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need restocking
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {stats?.out_of_stock_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Urgent attention
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.item_count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="items">
            <Package className="h-4 w-4 mr-2" />
            Items ({filteredItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="low-stock">
            <TrendingDown className="h-4 w-4 mr-2" />
            Low Stock ({lowStockItems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Activity className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Categories Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories?.slice(0, 5).map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || '#6b7280' }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{category.item_count} items</span>
                          {category.low_stock_items > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {category.low_stock_items} low
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {stats?.recently_updated_count || 0} items updated today
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last 24 hours
                      </p>
                    </div>
                  </div>
                  {lowStockItems?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Low stock: {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Inventory Items
                {searchQuery && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    - Search results for "{searchQuery}"
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading || searchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.is_low_stock && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                          {item.quantity === 0 && (
                            <Badge variant="outline" className="text-xs border-red-500 text-red-500">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {item.category_name && (
                            <span>Category: {item.category_name}</span>
                          )}
                          <span>Location: {item.location || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min: {item.minimum_quantity} {item.unit}
                        </div>
                        {item.quantity > 0 && (
                          <Progress
                            value={(item.quantity / (item.minimum_quantity * 2)) * 100}
                            className="w-20 h-2 mt-1"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredItems?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No items found matching your search.' : 'No items found.'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.quantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-500 text-orange-700">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        {item.category_name && (
                          <p className="text-sm text-muted-foreground">
                            Category: {item.category_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-orange-700">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min: {item.minimum_quantity} {item.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                  {lowStockItems?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>All items are well stocked!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Health</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Well Stocked</span>
                      <span className="font-semibold text-green-600">
                        {100 - (analytics?.lowStockPercentage || 0)}%
                      </span>
                    </div>
                    <Progress value={100 - (analytics?.lowStockPercentage || 0)} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span>Low Stock</span>
                      <span className="font-semibold text-orange-600">
                        {analytics?.lowStockPercentage || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={analytics?.lowStockPercentage || 0} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span>Out of Stock</span>
                      <span className="font-semibold text-red-600">
                        {analytics?.outOfStockPercentage || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={analytics?.outOfStockPercentage || 0} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="space-y-3">
                    {analytics?.categoryAnalytics?.slice(0, 5).map((cat) => (
                      <div key={cat.name} className="flex justify-between items-center">
                        <span className="text-sm">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cat.itemCount}</span>
                          {cat.lowStockItems > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {cat.lowStockItems} low
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
