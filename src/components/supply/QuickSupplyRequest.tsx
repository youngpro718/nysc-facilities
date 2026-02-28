import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useFavoriteItems } from '@/hooks/useFavoriteItems';
import { useOrderCart } from '@/hooks/useOrderCart';
import { InlineItemRow } from './InlineItemRow';
import { FavoritesStrip } from './FavoritesStrip';
import { OrderSummaryFooter } from './OrderSummaryFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const ALLOWED_CATEGORIES = ['Office Supplies', 'Furniture'];

export function QuickSupplyRequest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

  const { data: inventoryItems = [], isLoading } = useInventoryItems();
  const { isFavorite, toggleFavorite } = useFavoriteItems();

  const {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    submitOrder,
    totalItems,
    isSubmitting,
    hasRestrictedItems,
  } = useOrderCart();

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return (inventoryItems as Record<string, any>[]).filter((item) => {
      // Only show allowed categories
      const categoryName = item.inventory_categories?.name || '';
      if (!ALLOWED_CATEGORIES.includes(categoryName)) return false;

      // Search filter
      const matchesSearch =
        !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [inventoryItems, searchTerm, selectedCategory]);

  const handleAddItem = (item: any) => {
    addItem(
      {
        id: item.id,
        name: item.name,
        unit: item.unit,
        sku: item.sku,
        requires_justification: item.requires_justification,
      },
      1
    );
  };

  const handleIncrement = (item: any) => {
    const currentQty = cartItems.find((i) => i.item_id === item.id)?.quantity || 0;
    if (currentQty > 0) {
      updateQuantity(item.id, currentQty + 1);
    } else {
      handleAddItem(item);
    }
  };

  const handleDecrement = (item: any) => {
    const currentQty = cartItems.find((i) => i.item_id === item.id)?.quantity || 0;
    if (currentQty > 1) {
      updateQuantity(item.id, currentQty - 1);
    } else {
      removeItem(item.id);
    }
  };

  const getCartQuantity = (itemId: string) => {
    return cartItems.find((i) => i.item_id === itemId)?.quantity || 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="shrink-0 bg-background pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search supplies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isMobile ? "pl-9 h-10 rounded-xl text-[15px]" : "pl-9"}
            />
          </div>
          {/* Category Filter - inline pills */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className={isMobile ? "h-10 rounded-xl gap-0" : ""}>
              <TabsTrigger value="all" className={isMobile ? "rounded-lg text-xs px-2.5" : ""}>All</TabsTrigger>
              {ALLOWED_CATEGORIES.map((category) => (
                <TabsTrigger key={category} value={category} className={isMobile ? "rounded-lg text-xs px-2.5" : ""}>
                  {category.replace(' Supplies', '')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Favorites Strip */}
        <FavoritesStrip
          cartItems={cartItems}
          onAdd={handleAddItem}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
        />
      </div>

      {/* Items List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-32">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <InlineItemRow
                key={item.id}
                item={{
                  id: item.id,
                  name: item.name,
                  sku: item.sku,
                  unit: item.unit,
                  quantity: item.quantity,
                  categoryName: item.inventory_categories?.name,
                  requires_justification: item.requires_justification,
                  photo_url: item.photo_url,
                  description: item.description,
                }}
                cartQuantity={getCartQuantity(item.id)}
                isFavorite={isFavorite(item.id)}
                onAdd={() => handleAddItem(item)}
                onIncrement={() => handleIncrement(item)}
                onDecrement={() => handleDecrement(item)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Sticky Footer */}
      <OrderSummaryFooter
        items={cartItems}
        totalItems={totalItems}
        onRemove={removeItem}
        onUpdateQuantity={updateQuantity}
        onSubmit={submitOrder}
        onClear={clearCart}
        isSubmitting={isSubmitting}
        hasRestrictedItems={hasRestrictedItems}
      />
    </div>
  );
}
