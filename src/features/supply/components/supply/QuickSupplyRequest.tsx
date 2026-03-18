/**
 * QuickSupplyRequest - Modern supply ordering experience
 * 
 * Bold visual design with:
 * - Category cards for quick navigation
 * - Enhanced search with smart suggestions
 * - Visual item cards with inline controls
 * - Floating cart with smooth animations
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Package, Sparkles, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryItems } from '@features/inventory/hooks/useInventoryItems';
import { useFavoriteItems } from '@features/supply/hooks/useFavoriteItems';
import { useOrderCart } from '@features/supply/hooks/useOrderCart';
import { SupplyItemCard } from './SupplyItemCard';
import { FavoritesStrip } from './FavoritesStrip';
import { OrderSummaryFooter } from './OrderSummaryFooter';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@shared/hooks/use-mobile';

const ALLOWED_CATEGORIES = ['Office Supplies', 'Furniture'];

const CATEGORY_CONFIG: Record<string, { icon: string; gradient: string; description: string }> = {
  'Office Supplies': {
    icon: '📎',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    description: 'Pens, paper, staplers & more',
  },
  'Furniture': {
    icon: '🪑',
    gradient: 'from-amber-500/20 to-orange-500/10',
    description: 'Desks, chairs, storage',
  },
};

export function QuickSupplyRequest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
      const categoryName = item.inventory_categories?.name || '';
      if (!ALLOWED_CATEGORIES.includes(categoryName)) return false;

      const matchesSearch =
        !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        !selectedCategory || categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [inventoryItems, searchTerm, selectedCategory]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      const cat = item.inventory_categories?.name || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

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

  const showCategoryCards = !searchTerm && !selectedCategory;

  return (
    <div className="flex flex-col h-full overflow-x-hidden">
      {/* Search Bar - Hero style */}
      <div className="shrink-0 bg-background pb-3 space-y-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl -z-10" />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="What do you need?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-12 border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20",
              isMobile ? "h-12 rounded-2xl text-base" : "h-11 rounded-xl"
            )}
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          )}
        </div>

        {/* Favorites Strip */}
        <FavoritesStrip
          cartItems={cartItems}
          onAdd={handleAddItem}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-4 pb-36">
          {/* Category Cards - Show when no search/category selected */}
          {showCategoryCards && (
            <div className="grid grid-cols-2 gap-3">
                {ALLOWED_CATEGORIES.map((category) => {
                  const config = CATEGORY_CONFIG[category];
                  const itemCount = (inventoryItems as Record<string, any>[]).filter(
                    (i) => i.inventory_categories?.name === category
                  ).length;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all",
                        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                        "bg-gradient-to-br",
                        config?.gradient || 'from-muted to-muted/50'
                      )}
                    >
                      <span className="text-3xl mb-2 block">{config?.icon || '📦'}</span>
                      <h3 className="font-semibold text-sm">{category}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config?.description}
                      </p>
                      <span className="absolute top-3 right-3 text-xs text-muted-foreground/60">
                        {itemCount} items
                      </span>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Selected Category Header */}
          {selectedCategory && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CATEGORY_CONFIG[selectedCategory]?.icon}</span>
                <h2 className="font-bold text-lg">{selectedCategory}</h2>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Grid3X3 className="h-4 w-4" />
                All Categories
              </button>
            </div>
          )}

          {/* Items Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No items found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try adjusting your search
              </p>
            </div>
          ) : selectedCategory || searchTerm ? (
            // Grid view when category selected or searching
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <SupplyItemCard
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
              ))}
            </div>
          ) : (
            // Grouped view with category headers
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <span>{CATEGORY_CONFIG[category]?.icon || '📦'}</span>
                    {category}
                  </h3>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.slice(0, 4).map((item) => (
                    <SupplyItemCard
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
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
