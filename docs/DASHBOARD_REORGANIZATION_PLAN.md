# Dashboard Reorganization Plan

## 🎯 Goal
Create a cohesive, well-organized dashboard experience that clearly separates:
1. **Main Dashboard** - User's personal overview with supply requests, maintenance, keys
2. **Supply Room** - Inventory management and supplies (for supply staff)

---

## 📋 Current Structure Issues

### Problem:
- Supply staff dashboard was put on main dashboard
- Supply Room page should be for inventory/supplies
- Main dashboard needs better organization
- Missing user info at top
- No clear tab structure

---

## ✅ Proposed Structure

### **1. Main Dashboard** (`/dashboard`)

**For:** All users (regular staff, not supply staff)

**Top Section - User Info Card:**
```
┌─────────────────────────────────────────────────────────────┐
│ 👤 John Doe                                    🔔 [Report]   │
│ Admin Department | Room 1234                                 │
│ john.doe@nysc.gov | Ext: 5678                               │
│                                                               │
│ Quick Stats:                                                 │
│ [📦 3 Supply Requests] [🔧 2 Open Issues] [🔑 1 Key Held]  │
└─────────────────────────────────────────────────────────────┘
```

**Tabs:**
```
┌─────────────────────────────────────────────────────────────┐
│ [📦 Supply Requests (3)] [🔧 Maintenance (2)] [🔑 Keys (1)] │
└─────────────────────────────────────────────────────────────┘
```

**Tab 1: Supply Requests**
- User's supply requests
- Status tracking
- "New Request" button
- Timeline view

**Tab 2: Maintenance & Issues**
- User's reported issues
- Status updates
- "Report Issue" button
- Issue history

**Tab 3: Key Assignments**
- Keys currently held
- Key requests
- Return keys
- Request new keys

---

### **2. Supply Room Page** (`/supply-room`)

**For:** Supply staff ONLY

**Purpose:** Manage inventory and supplies

**Tabs:**
```
┌─────────────────────────────────────────────────────────────┐
│ [📦 Fulfill Orders] [📊 Inventory] [📈 Reports]             │
└─────────────────────────────────────────────────────────────┘
```

**Tab 1: Fulfill Orders**
- Incoming supply requests (what we just built)
- Stats cards
- Search and filter
- Fulfillment workflow

**Tab 2: Inventory**
- Stock levels
- Low stock alerts
- Add/edit items
- Reorder management

**Tab 3: Reports**
- Usage statistics
- Fulfillment metrics
- Inventory trends
- Export data

---

## 🎨 Detailed Dashboard Design

### **User Info Section** (Always Visible)

```typescript
<Card>
  <CardContent className="pt-6">
    <div className="flex items-start justify-between">
      {/* Left: User Info */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{fullName}</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{department} | Room {roomNumber}</p>
            <p>{email} | Ext: {extension}</p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex gap-2">
        <NotificationDropdown />
        <Button>Report Issue</Button>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-3 gap-4 mt-6">
      <div className="text-center">
        <div className="text-2xl font-bold">{supplyRequestCount}</div>
        <div className="text-xs text-muted-foreground">Supply Requests</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{openIssuesCount}</div>
        <div className="text-xs text-muted-foreground">Open Issues</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{keysHeldCount}</div>
        <div className="text-xs text-muted-foreground">Keys Held</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### **Tabbed Content**

```typescript
<Tabs defaultValue="supply-requests">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="supply-requests">
      <Package className="h-4 w-4 mr-2" />
      Supply Requests
      {supplyCount > 0 && <Badge className="ml-2">{supplyCount}</Badge>}
    </TabsTrigger>
    <TabsTrigger value="maintenance">
      <Wrench className="h-4 w-4 mr-2" />
      Maintenance
      {issuesCount > 0 && <Badge className="ml-2">{issuesCount}</Badge>}
    </TabsTrigger>
    <TabsTrigger value="keys">
      <Key className="h-4 w-4 mr-2" />
      Keys
      {keysCount > 0 && <Badge className="ml-2">{keysCount}</Badge>}
    </TabsTrigger>
  </TabsList>

  <TabsContent value="supply-requests">
    <EnhancedSupplyTracker />
  </TabsContent>

  <TabsContent value="maintenance">
    <IssuesTracker />
  </TabsContent>

  <TabsContent value="keys">
    <KeyAssignmentCard />
  </TabsContent>
</Tabs>
```

---

## 📁 File Structure

### **Main Dashboard:**
```
src/pages/UserDashboard.tsx
  ├── UserInfoCard (new)
  ├── Tabs
  │   ├── SupplyRequestsTab
  │   ├── MaintenanceTab
  │   └── KeysTab
```

### **Supply Room:**
```
src/pages/SupplyRoom.tsx
  ├── SupplyStaffDashboard
  │   ├── FulfillOrdersTab (what we built)
  │   ├── InventoryTab
  │   └── ReportsTab
```

---

## 🔄 User Flow

### **Regular User:**
```
Login → Dashboard
  ├── See user info at top
  ├── See quick stats
  ├── Click "Supply Requests" tab
  │   └── View/create requests
  ├── Click "Maintenance" tab
  │   └── View/report issues
  └── Click "Keys" tab
      └── View/request keys
```

### **Supply Staff:**
```
Login → Dashboard (same as regular user)
  └── Can also access Supply Room
      ├── Fulfill Orders tab
      ├── Inventory tab
      └── Reports tab
```

---

## 🎯 Key Improvements

### **1. Clear Separation**
- Dashboard = Personal overview
- Supply Room = Inventory management

### **2. User Info Prominent**
- Name, department, room
- Contact info
- Quick stats

### **3. Organized Tabs**
- Supply Requests
- Maintenance/Issues
- Keys
- Badge counts show what needs attention

### **4. Supply Room Focused**
- Fulfill Orders (incoming requests)
- Inventory (stock management)
- Reports (analytics)

---

## 📊 Implementation Steps

### **Step 1: Create UserInfoCard Component**
- Avatar
- Name and department
- Contact info
- Quick stats

### **Step 2: Reorganize UserDashboard**
- Add UserInfoCard at top
- Wrap content in Tabs
- Supply Requests tab
- Maintenance tab
- Keys tab

### **Step 3: Update Supply Room**
- Keep ImprovedSupplyStaffDashboard for "Fulfill Orders" tab
- Add Inventory tab
- Add Reports tab (optional)

### **Step 4: Update Navigation**
- Dashboard = Main personal dashboard
- Supply Room = Inventory management (supply staff only)

---

## ✅ Benefits

### **For Users:**
- See all their info at a glance
- Organized by task type
- Easy to find what they need
- Badge counts show priorities

### **For Supply Staff:**
- Clear separation of duties
- Fulfill orders in Supply Room
- Manage inventory in Supply Room
- Personal dashboard still available

### **For System:**
- Logical organization
- Clear purpose for each page
- Better user experience
- Easier to maintain

---

**Status:** Ready to implement
**Next:** Create UserInfoCard and reorganize UserDashboard
