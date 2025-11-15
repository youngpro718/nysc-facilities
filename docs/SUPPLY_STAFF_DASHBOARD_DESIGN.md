# Supply Staff Dashboard & Workflow - Design Document

## 🎯 Overview

A comprehensive dashboard for supply room staff to efficiently manage supply requests, track inventory, and fulfill orders with real-time updates and streamlined workflows.

## 📊 Current System Analysis

### Database Schema
- **supply_requests**: 35 columns with full fulfillment lifecycle
- **supply_request_items**: Quantity tracking (requested/approved/fulfilled)
- **supply_request_fulfillment_log**: Stage-by-stage audit trail
- **supply_request_receipts**: PDF receipt generation
- **inventory_items**: Stock levels and locations

### Existing Components
✅ PickingInterface - Inventory deduction workflow
✅ SupplyRequestTracking - Request management with real-time updates
✅ EnhancedSupplyRoomDashboard - Main dashboard structure
✅ InventoryPreviewCard - Stock preview
✅ ReceiveCompleteDialog - Order completion

### Current Workflow States
```
pending → approved → ready → completed
        ↓
     rejected
```

## 🎨 Dashboard Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Supply Room Dashboard                          [Refresh] [⚙️]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 METRICS ROW                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ New      │ │ Picking  │ │ Ready    │ │ Completed│      │
│  │ Orders   │ │ In Prog. │ │ Pickup   │ │ Today    │      │
│  │   12     │ │    3     │ │    5     │ │    8     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                               │
│  📋 MAIN CONTENT AREA                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [New Orders] [In Progress] [Ready] [Completed]        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │  Order Cards with:                                     │  │
│  │  - Requester info                                      │  │
│  │  - Items count & preview                               │  │
│  │  - Priority badge                                      │  │
│  │  - Action buttons                                      │  │
│  │  - Time tracking                                       │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  🔔 ALERTS & NOTIFICATIONS (Sidebar)                         │
│  - Low stock warnings                                        │
│  - Urgent requests                                           │
│  - Overdue pickups                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### 1. **Dashboard Overview**

**Metrics Cards:**
- **New Orders** - Awaiting action (status: `pending`, `approved`)
- **Picking in Progress** - Currently being picked
- **Ready for Pickup** - Completed, awaiting collection
- **Completed Today** - Fulfilled orders (last 24h)
- **Low Stock Alerts** - Items below minimum threshold
- **Average Fulfillment Time** - Performance metric

**Quick Stats:**
- Total requests this week
- Inventory value
- Top requested items
- Staff performance

### 2. **Request Management Tabs**

#### Tab 1: New Orders
**Status:** `pending`, `approved`
**Actions:**
- Start Picking
- View Details
- Reject (with reason)

**Display:**
```
┌─────────────────────────────────────────┐
│ 🔴 URGENT - Office Supplies             │
│ Requested by: John Doe (Admin Dept)     │
│ Items: 5 | Total Qty: 23                │
│ Requested: 2 hours ago                   │
│                                          │
│ [📦 Start Picking] [👁️ View] [❌ Reject]│
└─────────────────────────────────────────┘
```

#### Tab 2: In Progress
**Status:** `picking_started_at` set, not `ready`
**Actions:**
- Continue Picking
- Mark Ready
- Cancel

**Display:**
```
┌─────────────────────────────────────────┐
│ 📦 Picking - Printer Supplies           │
│ Assigned to: You                         │
│ Progress: 3/5 items picked               │
│ Started: 15 minutes ago                  │
│                                          │
│ [▶️ Continue] [✅ Mark Ready] [⏸️ Pause] │
└─────────────────────────────────────────┘
```

#### Tab 3: Ready for Pickup
**Status:** `ready`
**Actions:**
- Generate Receipt
- Mark Delivered
- Contact Requester

**Display:**
```
┌─────────────────────────────────────────┐
│ ✅ Ready - Office Furniture             │
│ Pickup by: Jane Smith (HR Dept)         │
│ Location: Supply Room Counter           │
│ Ready since: 1 hour ago                  │
│                                          │
│ [📄 Receipt] [🚚 Delivered] [📞 Contact]│
└─────────────────────────────────────────┘
```

#### Tab 4: Completed
**Status:** `completed`
**Actions:**
- View Receipt
- View Details
- Archive

**Display:**
```
┌─────────────────────────────────────────┐
│ ✓ Completed - Safety Equipment          │
│ Delivered to: Mike Johnson               │
│ Completed: Today at 2:30 PM              │
│ Duration: 45 minutes                     │
│                                          │
│ [📄 View Receipt] [ℹ️ Details]          │
└─────────────────────────────────────────┘
```

### 3. **Picking Workflow (Enhanced)**

**Current:** PickingInterface component
**Enhancements:**
- Barcode scanning support
- Voice confirmation
- Mobile-optimized view
- Batch picking for multiple orders
- Location guidance with map

**Flow:**
```
1. Select Order → 2. View Items → 3. Pick Items → 4. Verify Quantities → 5. Mark Ready
```

**Features:**
- Real-time stock validation
- Insufficient stock alerts
- Substitute suggestions
- Pick path optimization
- Time tracking per item

### 4. **Inventory Preview Integration**

**Component:** InventoryPreviewCard
**Usage:** Show stock levels while picking

**Features:**
- Current stock
- After-pick stock
- Minimum threshold warning
- Reorder suggestions
- Location information

### 5. **Notifications & Alerts**

**Alert Types:**
- 🔴 **Urgent Requests** - Priority: urgent
- ⚠️ **Low Stock** - Below minimum threshold
- ⏰ **Overdue Pickups** - Ready > 24 hours
- 📊 **Daily Summary** - End of day report
- ✅ **Completed Orders** - Confirmation

**Delivery Methods:**
- In-app notifications
- Email summaries
- Desktop notifications (optional)

### 6. **Performance Metrics**

**Staff Dashboard:**
- Orders fulfilled today/week/month
- Average fulfillment time
- Accuracy rate
- Customer satisfaction
- Personal goals/targets

**Manager Dashboard:**
- Team performance
- Bottleneck identification
- Inventory turnover
- Cost tracking
- Trend analysis

## 🔄 Workflow States & Transitions

### State Machine

```
┌─────────┐
│ pending │ ─────────────────┐
└─────────┘                   │
     │                        │
     │ approve                │ reject
     ↓                        ↓
┌─────────┐              ┌──────────┐
│approved │              │ rejected │
└─────────┘              └──────────┘
     │
     │ start_picking
     ↓
┌─────────┐
│ picking │
└─────────┘
     │
     │ mark_ready
     ↓
┌─────────┐
│  ready  │
└─────────┘
     │
     │ mark_delivered
     ↓
┌───────────┐
│ completed │
└───────────┘
```

### Timestamps Tracked

- `created_at` - Request submitted
- `approval_requested_at` - Sent for approval
- `approved_at` - Approved by manager
- `picking_started_at` - Staff starts picking
- `picking_completed_at` - All items picked
- `ready_for_delivery_at` - Ready for pickup
- `fulfilled_at` - Delivered to requester
- `work_started_at` - Work timer start
- `work_completed_at` - Work timer end
- `work_duration_minutes` - Calculated duration

## 🎨 UI Components

### 1. **MetricsCard Component**

```typescript
interface MetricsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'yellow' | 'red';
}
```

### 2. **OrderCard Component**

```typescript
interface OrderCardProps {
  request: SupplyRequest;
  onStartPicking?: () => void;
  onMarkReady?: () => void;
  onMarkDelivered?: () => void;
  onReject?: () => void;
  showActions: boolean;
}
```

### 3. **PickingProgress Component**

```typescript
interface PickingProgressProps {
  totalItems: number;
  pickedItems: number;
  currentItem?: string;
  timeElapsed: number;
}
```

### 4. **StockAlert Component**

```typescript
interface StockAlertProps {
  item: InventoryItem;
  currentStock: number;
  minimumThreshold: number;
  severity: 'warning' | 'critical';
}
```

## 📱 Mobile Optimization

### Responsive Design
- **Desktop:** Full dashboard with sidebar
- **Tablet:** Collapsed sidebar, full cards
- **Mobile:** Single column, swipeable tabs

### Mobile-Specific Features
- Barcode scanner integration
- Voice commands for hands-free picking
- Offline mode for picking
- Push notifications
- Quick actions (swipe gestures)

## 🔐 Role-Based Access

### Supply Staff
- View all orders
- Pick orders
- Mark ready
- Generate receipts
- View inventory
- Cannot approve/reject

### Supply Manager
- All staff permissions
- Approve/reject requests
- Assign orders to staff
- View performance metrics
- Manage inventory
- Configure settings

### Requester
- Submit requests
- View own requests
- Track status
- Receive notifications
- Cannot access supply room

## 📊 Analytics & Reporting

### Daily Reports
- Orders processed
- Average fulfillment time
- Stock movements
- Staff performance

### Weekly Reports
- Trend analysis
- Top requested items
- Inventory turnover
- Cost analysis

### Monthly Reports
- Performance metrics
- Budget tracking
- Forecasting
- Recommendations

## 🔔 Notification System

### Real-Time Notifications
```typescript
interface Notification {
  id: string;
  type: 'urgent_request' | 'low_stock' | 'overdue_pickup' | 'completed';
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  createdAt: Date;
}
```

### Notification Triggers
- New urgent request
- Stock below threshold
- Pickup overdue (>24h)
- Order completed
- Assignment received
- Approval needed

## 🚀 Implementation Plan

### Phase 1: Dashboard Overview (Week 1)
- [ ] Create MetricsCard component
- [ ] Implement metrics calculation
- [ ] Add real-time updates
- [ ] Design responsive layout

### Phase 2: Order Management (Week 2)
- [ ] Enhance OrderCard component
- [ ] Implement tab navigation
- [ ] Add filtering/sorting
- [ ] Create action handlers

### Phase 3: Picking Workflow (Week 3)
- [ ] Enhance PickingInterface
- [ ] Add barcode scanning
- [ ] Implement time tracking
- [ ] Add batch picking

### Phase 4: Inventory Integration (Week 4)
- [ ] Integrate InventoryPreviewCard
- [ ] Add stock alerts
- [ ] Implement reorder suggestions
- [ ] Create location guidance

### Phase 5: Notifications (Week 5)
- [ ] Build notification system
- [ ] Add email integration
- [ ] Implement push notifications
- [ ] Create notification center

### Phase 6: Analytics (Week 6)
- [ ] Create performance metrics
- [ ] Build reporting dashboard
- [ ] Add export functionality
- [ ] Implement forecasting

## 🎯 Success Metrics

### Efficiency
- Reduce average fulfillment time by 30%
- Increase orders processed per day by 25%
- Reduce picking errors by 50%

### User Satisfaction
- Staff satisfaction score > 4.5/5
- Requester satisfaction score > 4.5/5
- System usability score > 85%

### Operational
- Stock accuracy > 98%
- On-time delivery rate > 95%
- Cost per order reduction by 15%

## 🔧 Technical Stack

### Frontend
- React + TypeScript
- TailwindCSS for styling
- shadcn/ui components
- React Query for data fetching
- Zustand for state management

### Backend
- Supabase (PostgreSQL)
- Real-time subscriptions
- Row Level Security (RLS)
- Edge Functions for PDF generation

### Features
- Real-time updates via Supabase subscriptions
- Optimistic UI updates
- Offline support (PWA)
- Barcode scanning (QuaggaJS)
- PDF generation (jsPDF)

## 📚 Next Steps

1. Review and approve design
2. Create detailed component specifications
3. Set up development environment
4. Begin Phase 1 implementation
5. Conduct user testing
6. Iterate based on feedback
7. Deploy to production

---

**Status:** Design Complete - Ready for Implementation
**Last Updated:** October 26, 2025
**Version:** 1.0
