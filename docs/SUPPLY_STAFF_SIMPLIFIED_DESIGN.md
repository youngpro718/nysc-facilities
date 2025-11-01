# Supply Staff Dashboard - Simplified Design

## 🎯 Core Concept

**Simple workflow:** See orders → Pick what they need → Click items as fulfilled → Inventory auto-subtracts → Generate receipt

## 📋 Main Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Supply Room - Incoming Orders                    [Refresh]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📦 ORDER #1234                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Ordered by: John Doe (Admin Department)               │  │
│  │ Delivery to: Room 1234                                 │  │
│  │ Requested: 2 hours ago                                 │  │
│  │                                                         │  │
│  │ Items Requested:                                       │  │
│  │ ☐ Pens (Box of 12) - Qty: 2                           │  │
│  │ ☐ Paper Reams (500 sheets) - Qty: 5                   │  │
│  │ ☐ Staplers - Qty: 1                                    │  │
│  │                                                         │  │
│  │ [📦 Start Fulfilling Order]                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  📦 ORDER #1235                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Ordered by: Jane Smith (HR Department)                 │  │
│  │ Delivery to: Room 567                                  │  │
│  │ Requested: 5 hours ago                                 │  │
│  │                                                         │  │
│  │ Items Requested:                                       │  │
│  │ ☐ Folders - Qty: 10                                    │  │
│  │ ☐ Binders - Qty: 3                                     │  │
│  │                                                         │  │
│  │ [📦 Start Fulfilling Order]                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fulfillment Workflow

### Step 1: View Order Details
When staff clicks "Start Fulfilling Order":

```
┌─────────────────────────────────────────────────────────────┐
│ Fulfilling Order #1234                          [X Close]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📋 Order Information                                        │
│  Ordered by: John Doe (Admin Department)                    │
│  Delivery to: Room 1234                                      │
│  Requested: 2 hours ago                                      │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  📦 Items to Fulfill                                         │
│                                                               │
│  ☐ Pens (Box of 12)                                         │
│     Requested: 2 boxes                                       │
│     In Stock: 15 boxes                                       │
│     After Fulfillment: 13 boxes                              │
│                                                               │
│  ☐ Paper Reams (500 sheets)                                 │
│     Requested: 5 reams                                       │
│     In Stock: 20 reams                                       │
│     After Fulfillment: 15 reams                              │
│                                                               │
│  ☐ Staplers                                                  │
│     Requested: 1 stapler                                     │
│     In Stock: 8 staplers                                     │
│     After Fulfillment: 7 staplers                            │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  [✅ Mark All Items Fulfilled & Generate Receipt]           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Click Items as Fulfilled
Staff checks off each item as they pick it:

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Pens (Box of 12)                    ← CHECKED           │
│     Requested: 2 boxes                                       │
│     In Stock: 15 boxes → 13 boxes ✓                         │
│                                                               │
│  ✅ Paper Reams (500 sheets)            ← CHECKED           │
│     Requested: 5 reams                                       │
│     In Stock: 20 reams → 15 reams ✓                         │
│                                                               │
│  ☐ Staplers                             ← NOT YET           │
│     Requested: 1 stapler                                     │
│     In Stock: 8 staplers                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Complete & Generate Receipt
When all items are checked:

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Order #1234 Fulfilled!                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  All items have been picked and inventory has been updated.  │
│                                                               │
│  📄 Receipt Generated                                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ SUPPLY ROOM RECEIPT                                  │    │
│  │ Order #1234                                           │    │
│  │ Date: Oct 26, 2025 8:30 PM                           │    │
│  │                                                       │    │
│  │ Fulfilled for: John Doe (Admin Department)           │    │
│  │ Delivery to: Room 1234                               │    │
│  │                                                       │    │
│  │ Items Fulfilled:                                      │    │
│  │ - Pens (Box of 12) x 2                               │    │
│  │ - Paper Reams (500 sheets) x 5                       │    │
│  │ - Staplers x 1                                        │    │
│  │                                                       │    │
│  │ Fulfilled by: Supply Staff Name                       │    │
│  │ Signature: _____________________                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [📧 Email Receipt to Requester]  [🖨️ Print]  [✓ Done]     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Data Flow

### 1. Order Comes In
```sql
INSERT INTO supply_requests (
  requester_id,
  title,
  delivery_location,  -- Room number
  status
) VALUES (...);

INSERT INTO supply_request_items (
  request_id,
  item_id,
  quantity_requested
) VALUES (...);
```

### 2. Staff Starts Fulfilling
```sql
UPDATE supply_requests 
SET 
  status = 'picking',
  picking_started_at = NOW(),
  assigned_fulfiller_id = current_user_id
WHERE id = order_id;
```

### 3. Staff Checks Items
As each item is checked:
```sql
-- Mark item as fulfilled
UPDATE supply_request_items
SET quantity_fulfilled = quantity_requested
WHERE id = item_id;
```

### 4. All Items Checked → Auto-Subtract Inventory
```sql
-- For each fulfilled item:
UPDATE inventory_items
SET quantity = quantity - fulfilled_quantity
WHERE id = item_id;

-- Or use the existing RPC function:
SELECT adjust_inventory_quantity(
  p_item_id := item_id,
  p_quantity_change := -fulfilled_quantity,
  p_transaction_type := 'fulfilled',
  p_reference_id := order_id,
  p_notes := 'Order #1234 fulfilled'
);
```

### 5. Generate Receipt
```sql
INSERT INTO supply_request_receipts (
  request_id,
  receipt_type,
  receipt_number,
  generated_by,
  pdf_data
) VALUES (
  order_id,
  'pickup',
  'RCP-' || order_id,
  current_user_id,
  receipt_json_data
);

UPDATE supply_requests
SET 
  status = 'completed',
  fulfilled_at = NOW(),
  fulfilled_by = current_user_id
WHERE id = order_id;
```

## 📊 Simple Component Structure

### Main Dashboard Component
```typescript
// src/components/supply/SimpleSupplyDashboard.tsx

export function SimpleSupplyDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Fetch all pending orders
  const { data: orders } = useQuery({
    queryKey: ['supply-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('supply_requests')
        .select(`
          *,
          profiles:requester_id (first_name, last_name, department),
          supply_request_items (
            *,
            inventory_items (name, quantity, unit)
          )
        `)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });
      return data;
    }
  });
  
  return (
    <div>
      <h1>Incoming Orders</h1>
      
      {orders?.map(order => (
        <OrderCard 
          key={order.id}
          order={order}
          onFulfill={() => setSelectedOrder(order)}
        />
      ))}
      
      {selectedOrder && (
        <FulfillmentDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
```

### Order Card Component
```typescript
// src/components/supply/OrderCard.tsx

interface OrderCardProps {
  order: SupplyRequest;
  onFulfill: () => void;
}

export function OrderCard({ order, onFulfill }: OrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p>Ordered by: {order.profiles.first_name} {order.profiles.last_name}</p>
          <p>Department: {order.profiles.department}</p>
          <p>Delivery to: {order.delivery_location}</p>
          <p>Requested: {formatDistanceToNow(order.created_at)} ago</p>
        </div>
        
        <div className="mt-4">
          <p className="font-semibold">Items Requested:</p>
          {order.supply_request_items.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox disabled />
              <span>{item.inventory_items.name} - Qty: {item.quantity_requested}</span>
            </div>
          ))}
        </div>
        
        <Button onClick={onFulfill} className="mt-4">
          📦 Start Fulfilling Order
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Fulfillment Dialog Component
```typescript
// src/components/supply/FulfillmentDialog.tsx

export function FulfillmentDialog({ order, onClose }: FulfillmentDialogProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  
  const allItemsChecked = checkedItems.size === order.supply_request_items.length;
  
  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // 1. Mark order as picking
      await supabase
        .from('supply_requests')
        .update({
          status: 'picking',
          picking_started_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      // 2. For each item, subtract from inventory
      for (const item of order.supply_request_items) {
        // Mark item as fulfilled
        await supabase
          .from('supply_request_items')
          .update({ quantity_fulfilled: item.quantity_requested })
          .eq('id', item.id);
        
        // Subtract from inventory
        await supabase.rpc('adjust_inventory_quantity', {
          p_item_id: item.item_id,
          p_quantity_change: -item.quantity_requested,
          p_transaction_type: 'fulfilled',
          p_reference_id: order.id,
          p_notes: `Order fulfilled for ${order.profiles.first_name} ${order.profiles.last_name}`
        });
      }
      
      // 3. Mark order as completed
      await supabase
        .from('supply_requests')
        .update({
          status: 'completed',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      // 4. Generate receipt
      const receiptData = {
        orderNumber: order.id.slice(0, 8),
        date: new Date().toISOString(),
        requester: `${order.profiles.first_name} ${order.profiles.last_name}`,
        department: order.profiles.department,
        deliveryLocation: order.delivery_location,
        items: order.supply_request_items.map(item => ({
          name: item.inventory_items.name,
          quantity: item.quantity_requested,
          unit: item.inventory_items.unit
        }))
      };
      
      await supabase
        .from('supply_request_receipts')
        .insert({
          request_id: order.id,
          receipt_type: 'pickup',
          receipt_number: `RCP-${order.id.slice(0, 8)}`,
          pdf_data: receiptData
        });
      
      toast.success('Order fulfilled successfully!');
      onClose();
      
    } catch (error) {
      toast.error('Failed to fulfill order');
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fulfilling Order #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p>Ordered by: {order.profiles.first_name} {order.profiles.last_name}</p>
            <p>Delivery to: {order.delivery_location}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold mb-2">Items to Fulfill</h3>
            {order.supply_request_items.map(item => {
              const isChecked = checkedItems.has(item.id);
              const currentStock = item.inventory_items.quantity;
              const afterStock = currentStock - item.quantity_requested;
              
              return (
                <div key={item.id} className="border rounded p-3 mb-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(checkedItems);
                        if (checked) {
                          newSet.add(item.id);
                        } else {
                          newSet.delete(item.id);
                        }
                        setCheckedItems(newSet);
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.inventory_items.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested: {item.quantity_requested} {item.inventory_items.unit}
                      </p>
                      <p className="text-sm">
                        In Stock: {currentStock} → After: {afterStock}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button
            onClick={handleComplete}
            disabled={!allItemsChecked || isCompleting}
            className="w-full"
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fulfilling Order...
              </>
            ) : (
              <>
                ✅ Mark All Items Fulfilled & Generate Receipt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 🎯 Key Features

### 1. **See All Orders**
- List of all incoming orders
- Shows who ordered
- Shows delivery room
- Shows requested items

### 2. **Fulfill Order**
- Click to start fulfilling
- Check off items as you pick them
- See current stock levels
- See what stock will be after fulfillment

### 3. **Auto-Subtract Inventory**
- When all items checked → inventory automatically updates
- Uses existing `adjust_inventory_quantity` RPC function
- Transaction logged for audit trail

### 4. **Generate Receipt**
- Automatic receipt generation
- Shows all fulfilled items
- Includes requester info
- Includes delivery location
- Can email or print

## 📋 Implementation Steps

1. **Create SimpleSupplyDashboard component**
2. **Create OrderCard component**
3. **Create FulfillmentDialog component**
4. **Test inventory subtraction**
5. **Test receipt generation**
6. **Deploy and train staff**

## ✅ Success Criteria

- ✅ Staff can see all incoming orders
- ✅ Staff can see who ordered and delivery room
- ✅ Staff can check off items as they fulfill
- ✅ Inventory automatically subtracts when fulfilled
- ✅ Receipt automatically generates
- ✅ Simple, intuitive interface

---

**This is the simplified, focused version based on your requirements!**
