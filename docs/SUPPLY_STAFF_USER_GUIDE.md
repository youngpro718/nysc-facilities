# Supply Staff Dashboard - User Guide

## 🎯 Quick Start

The Supply Staff Dashboard is a simple, streamlined interface for fulfilling supply requests.

## 📋 How It Works

### Step 1: View Incoming Orders

When you open the Supply Room page, you'll see all pending orders:

```
Each order card shows:
- Order number
- Who ordered it (name + department)
- Where it's going (room number)
- What items they need
- When it was requested
```

### Step 2: Start Fulfilling an Order

Click the **"Start Fulfilling Order"** button on any order card.

This opens the fulfillment dialog showing:
- Order details
- List of all items needed
- Current stock levels
- What stock will be after fulfillment

### Step 3: Check Items as You Pick Them

As you gather each item:
1. ✅ Check the box next to the item
2. See the stock level update in real-time
3. Get warnings if stock is insufficient

### Step 4: Complete the Order

Once all items are checked:
1. Click **"Mark All Fulfilled & Generate Receipt"**
2. System automatically:
   - Subtracts items from inventory
   - Marks order as completed
   - Generates a receipt
   - Notifies the requester

## 🔄 What Happens Automatically

### Inventory Subtraction
When you complete an order, the system:
- Deducts each item quantity from inventory
- Records the transaction
- Updates stock levels instantly
- Logs who fulfilled the order and when

### Receipt Generation
A receipt is automatically created with:
- Order number
- Date and time
- Requester information
- Delivery location
- List of all items fulfilled
- Staff member who fulfilled it

## ⚠️ Important Notes

### Stock Warnings
- **Red warning**: Not enough stock to fulfill
- **Green check**: Sufficient stock available
- You'll see "After: X" showing what stock will be after fulfillment

### Order Priority
- 🔴 **URGENT** - Red badge, handle immediately
- 🟡 **HIGH** - Yellow badge, prioritize
- No badge - Normal priority

### Real-Time Updates
- Dashboard auto-refreshes every 30 seconds
- New orders appear automatically
- Click refresh button for manual update

## 🖥️ Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Supply Room - Incoming Orders                    [Refresh]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  X orders awaiting fulfillment                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📦 Order #ABC123                    🔴 URGENT       │    │
│  │                                                      │    │
│  │ 👤 John Doe (Admin Department)                      │    │
│  │ 📍 Delivery to: Room 1234                           │    │
│  │ 🕐 Requested 2 hours ago                            │    │
│  │                                                      │    │
│  │ Items Requested (3):                                │    │
│  │ ☐ Pens - Qty: 2                                     │    │
│  │ ☐ Paper - Qty: 5                                    │    │
│  │ ☐ Staplers - Qty: 1                                 │    │
│  │                                                      │    │
│  │ [📦 Start Fulfilling Order]                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Mobile Access

The dashboard works on mobile devices:
- Responsive design
- Touch-friendly buttons
- Swipe to refresh
- All features available

## ❓ Troubleshooting

### "Insufficient Stock" Warning
**Problem:** Not enough items in inventory
**Solution:** 
- Check if items are in different location
- Order more stock
- Contact requester to adjust quantity

### Order Not Appearing
**Problem:** Order submitted but not showing
**Solution:**
- Click refresh button
- Check if order status is "pending" or "approved"
- Contact admin if issue persists

### Can't Complete Order
**Problem:** "Mark All Fulfilled" button disabled
**Solution:**
- Make sure ALL items are checked
- Check for stock warnings
- Ensure you have permission

## 🔐 Access Requirements

To use the Supply Staff Dashboard, you need:
- Supply room staff role, OR
- Supply requests permission (write or admin), OR
- Assigned to Supply Department

## 📊 Data Flow

```
1. Order Created
   ↓
2. Appears in Dashboard
   ↓
3. Staff Clicks "Start Fulfilling"
   ↓
4. Staff Checks Items
   ↓
5. Staff Clicks "Mark All Fulfilled"
   ↓
6. System Subtracts Inventory
   ↓
7. System Generates Receipt
   ↓
8. Order Marked Complete
   ↓
9. Requester Notified
```

## 🎯 Best Practices

### Efficiency Tips
1. **Handle urgent orders first** - Look for red badges
2. **Check stock before starting** - Avoid surprises
3. **Complete orders promptly** - Don't leave partially fulfilled
4. **Double-check quantities** - Ensure accuracy

### Quality Control
1. **Verify item names** - Make sure you have the right item
2. **Count carefully** - Confirm quantities match request
3. **Check condition** - Ensure items are in good condition
4. **Note any issues** - Report damaged or missing items

## 📞 Support

If you encounter issues:
1. Try refreshing the page
2. Check your internet connection
3. Contact your supervisor
4. Report technical issues to IT

## 🔄 Updates

The dashboard receives automatic updates:
- New features added regularly
- Bug fixes deployed quickly
- No action required from you

---

**Last Updated:** October 26, 2025
**Version:** 1.0
