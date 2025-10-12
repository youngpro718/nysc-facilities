import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Package } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { ItemCard } from './ItemCard';
import { OrderCart } from './OrderCart';
import { useOrderCart } from '@/hooks/useOrderCart';
import { CardGrid } from '@/components/data-display/CardGrid';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ALLOWED_CATEGORIES = ['Office Supplies', 'Furniture'];

export function QuickOrderGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: inventoryItems = [], isLoading } = useInventoryItems();
  
  const {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    submitOrder,
    totalItems,
    isSubmitting,
  } = useOrderCart();

  const filteredItems = useMemo(() => {
    return (inventoryItems as any[]).filter(item => {
      // Only show allowed categories
      const isAllowedCategory = ALLOWED_CATEGORIES.includes(item.inventory_categories?.name || '');
      if (!isAllowedCategory) return false;

      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        item.inventory_categories?.name === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [inventoryItems, searchTerm, selectedCategory]);

  const getCartQuantity = (itemId: string) => {
    return cartItems.find(i => i.item_id === itemId)?.quantity || 0;
  };

  const handleAddItem = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      unit: item.unit,
      sku: item.sku,
    });
  };

  const handleIncrement = (item: any) => {
    const currentQty = getCartQuantity(item.id);
    updateQuantity(item.id, currentQty + 1);
  };

  const handleDecrement = (item: any) => {
    const currentQty = getCartQuantity(item.id);
    if (currentQty === 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, currentQty - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading supplies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search supplies by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="px-3 py-2">
            <Filter className="h-4 w-4 mr-2" />
            {filteredItems.length}
          </Badge>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">
              All Items
            </TabsTrigger>
            {ALLOWED_CATEGORIES.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No supplies found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm 
              ? 'Try adjusting your search or filters'
              : 'No supplies available at the moment'
            }
          </p>
        </div>
      ) : (
        <CardGrid
          columns={{ default: 1, sm: 2, lg: 3, xl: 4 }}
          gap="medium"
        >
          {filteredItems.map((item: any) => (
            <ItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              sku={item.sku}
              description={item.description}
              quantity={item.quantity || 0}
              unit={item.unit}
              category={item.inventory_categories?.name}
              cartQuantity={getCartQuantity(item.id)}
              onAdd={() => handleAddItem(item)}
              onIncrement={() => handleIncrement(item)}
              onDecrement={() => handleDecrement(item)}
            />
          ))}
        </CardGrid>
      )}

      {/* Floating Cart Button */}
      <OrderCart
        items={cartItems}
        totalItems={totalItems}
        onRemove={removeItem}
        onUpdateQuantity={updateQuantity}
        onSubmit={submitOrder}
        onClear={clearCart}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
