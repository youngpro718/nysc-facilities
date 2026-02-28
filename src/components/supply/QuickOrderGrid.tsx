import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useFavoriteItems } from '@/hooks/useFavoriteItems';
import { CompactItemList } from './CompactItemList';
import { ItemDetailPanel } from './ItemDetailPanel';
import { FavoritesTab } from './FavoritesTab';
import { OrderCart } from './OrderCart';
import { useOrderCart } from '@/hooks/useOrderCart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

const ALLOWED_CATEGORIES = ['Office Supplies', 'Furniture'];

export function QuickOrderGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const isMobile = useIsMobile();
  const { data: inventoryItems = [], isLoading } = useInventoryItems();
  const { favorites, isFavorite, toggleFavorite } = useFavoriteItems();
  
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
    const filtered = (inventoryItems as Record<string, any>[]).filter(item => {
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
    
    return filtered;
  }, [inventoryItems, searchTerm, selectedCategory]);

  const selectedItem = selectedItemId 
    ? inventoryItems.find((item: any) => item.id === selectedItemId)
    : null;

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    if (isMobile) {
      setShowDetailModal(true);
    }
  };

  const handleAddItem = (item: any, quantity: number = 1) => {
    addItem({
      id: item.id as string,
      name: item.name as string,
      unit: item.unit as string,
      sku: item.sku as string,
    }, quantity);
  };

  const handleIncrement = (item: any) => {
    const currentQty = cartItems.find((i: any) => i.item_id === item.id)?.quantity || 0;
    if (currentQty > 0) {
      updateQuantity(item.id, currentQty + 1);
    } else {
      handleAddItem(item, 1);
    }
  };

  const handleDecrement = (item: any) => {
    const currentQty = cartItems.find((i: any) => i.item_id === item.id)?.quantity || 0;
    if (currentQty > 1) {
      updateQuantity(item.id, currentQty - 1);
    } else {
      removeItem(item.id);
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    await toggleFavorite(itemId);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="favorites">⭐ Favorites</TabsTrigger>
        </TabsList>

        {/* All Items Tab */}
        <TabsContent value="all" className="mt-4">
          {/* Category Filters */}
          <div className="mb-4">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {ALLOWED_CATEGORIES.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category.replace(' Supplies', '')}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Desktop: Split Layout */}
          {!isMobile ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <CompactItemList
                  items={filteredItems}
                  cartItems={cartItems}
                  selectedItemId={selectedItemId}
                  isLoading={isLoading}
                  onSelectItem={handleSelectItem}
                  onAddItem={handleAddItem}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              </div>
              <div className="sticky top-4 h-fit border rounded-lg p-4 bg-card">
                <ItemDetailPanel
                  item={selectedItem}
              cartQuantity={selectedItem ? cartItems.find((i: any) => i.item_id === selectedItem.id)?.quantity || 0 : 0}
                  isFavorite={selectedItem ? isFavorite(selectedItem.id) : false}
                  onToggleFavorite={() => selectedItem && handleToggleFavorite(selectedItem.id)}
                  onAddToCart={(qty) => selectedItem && handleAddItem(selectedItem, qty)}
                />
              </div>
            </div>
          ) : (
            /* Mobile: List Only */
            <CompactItemList
              items={filteredItems}
              cartItems={cartItems}
              selectedItemId={selectedItemId}
              isLoading={isLoading}
              onSelectItem={handleSelectItem}
              onAddItem={handleAddItem}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="mt-4">
          {!isMobile ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FavoritesTab
                  cartItems={cartItems}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onAddItem={handleAddItem}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              </div>
              <div className="sticky top-4 h-fit border rounded-lg p-4 bg-card">
                <ItemDetailPanel
                  item={selectedItem}
              cartQuantity={selectedItem ? cartItems.find((i: any) => i.item_id === selectedItem.id)?.quantity || 0 : 0}
                  isFavorite={selectedItem ? isFavorite(selectedItem.id) : false}
                  onToggleFavorite={() => selectedItem && handleToggleFavorite(selectedItem.id)}
                  onAddToCart={(qty) => selectedItem && handleAddItem(selectedItem, qty)}
                />
              </div>
            </div>
          ) : (
            <FavoritesTab
              cartItems={cartItems}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
              onAddItem={handleAddItem}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile Detail Modal */}
      {isMobile && (
        <ResponsiveDialog
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          title="Item Details"
        >
          <ItemDetailPanel
            item={selectedItem}
            cartQuantity={selectedItem ? cartItems.find((i: any) => i.item_id === selectedItem.id)?.quantity || 0 : 0}
            isFavorite={selectedItem ? isFavorite(selectedItem.id) : false}
            onToggleFavorite={() => {
              if (selectedItem) {
                handleToggleFavorite(selectedItem.id);
              }
            }}
            onAddToCart={(qty) => {
              if (selectedItem) {
                handleAddItem(selectedItem, qty);
                setShowDetailModal(false);
              }
            }}
          />
        </ResponsiveDialog>
      )}

      {/* Order Cart */}
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
