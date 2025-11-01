# Role-Based Access Control (RBAC) Strategy

**Date:** October 26, 2025, 11:03 AM UTC-04:00  
**Purpose:** Define comprehensive role hierarchy and access permissions  
**Status:** 📋 **STRATEGIC PLAN**

---

## 🎯 **Role Hierarchy Overview**

Based on your requirements, here's the proposed role structure:

```
ADMIN (Full Access)
    ↓
COURT MANAGEMENT COORDINATOR (CMC)
    ↓
PURCHASING STAFF
    ↓
SUPPLY ROOM STAFF (Courtaides)
    ↓
REGULAR USERS (Standard Court Employees)
```

---

## 👥 **Role Definitions**

### **1. ADMIN** 
**Who:** System administrators, IT staff  
**Access Level:** Full access to everything

**Can See:**
- ✅ All modules
- ✅ All dashboards
- ✅ All data
- ✅ User management
- ✅ System settings

**Navigation:**
- Dashboard (Admin view)
- Spaces Management
- Operations Hub
- Court Operations
- Occupants Management
- Keys Management
- Inventory Management
- Lighting Management
- Supply Room
- Admin Profile
- System Settings
- Access Management

---

### **2. COURT MANAGEMENT COORDINATOR (CMC)**
**Who:** Court managers who oversee clerks, courtrooms, and judge assignments  
**Title:** Court Management Coordinator  
**Access Level:** Court operations + operational oversight

**Can See:**
- ✅ Court Operations (full access)
- ✅ Issues/Maintenance (report and view)
- ✅ Supply Requests (submit only)
- ✅ Supply Orders (view status)
- ✅ Dashboard (CMC-specific view)
- ✅ Their own profile

**Cannot See:**
- ❌ Keys Management
- ❌ Occupants Management (full)
- ❌ Spaces Management (building/facilities)
- ❌ Inventory Management
- ❌ Lighting Management
- ❌ Supply Room (fulfillment)
- ❌ Admin functions

**Navigation:**
- Dashboard (CMC view)
- Court Operations (full)
  - Courtroom Status
  - Judge Assignments
  - Term Management
  - Room Shutdowns
  - Personnel Assignments
- Operations (limited)
  - Report Issues
  - View Maintenance
  - Submit Supply Requests
- My Requests
- My Issues
- Profile

**Specific Permissions:**
```typescript
cmc: {
  spaces: null,                    // No building management
  issues: 'write',                 // Can report issues
  occupants: null,                 // No occupant management
  inventory: null,                 // No inventory access
  supply_requests: 'write',        // Can submit requests
  keys: null,                      // No key management
  lighting: null,                  // No lighting management
  maintenance: 'read',             // Can view maintenance
  court_operations: 'admin',       // Full court operations
  operations: 'write',             // Can report operational issues
  dashboard: 'read',               // CMC-specific dashboard
}
```

---

### **3. COURT AIDE (Supply Staff)**
**Who:** Court aides who are the supply staff - handle supply orders, inventory, and supply room  
**Title:** Court Aide  
**Access Level:** Supply orders + inventory + supply room

**Can See:**
- ✅ Supply Orders (create, manage, track)
- ✅ Supply Room (fulfill requests)
- ✅ Inventory (full management)
- ✅ Supply Requests (view and fulfill)
- ✅ Dashboard (court aide metrics)
- ✅ Their own profile

**Cannot See:**
- ❌ Keys Management
- ❌ Occupants Management
- ❌ Spaces Management
- ❌ Court Operations
- ❌ Lighting Management
- ❌ Admin functions

**Navigation:**
- Dashboard (Court Aide view)
- Supply Orders
  - Create Orders
  - Track Orders
  - Vendor Management
  - Budget Tracking
- Supply Room
  - Fulfill Requests
  - Approve/Reject
  - Request History
- Inventory
  - Add/Edit Items
  - Update Stock
  - Low Stock Alerts
  - Categories
- Operations (limited)
  - Report Issues
- Profile

**Specific Permissions:**
```typescript
court_aide: {
  spaces: null,
  issues: 'write',                 // Can report issues
  occupants: 'read',               // View requester info
  inventory: 'admin',              // Full inventory management
  supply_requests: 'admin',        // Full request fulfillment
  supply_orders: 'admin',          // Full order management
  keys: null,
  lighting: null,
  maintenance: null,
  court_operations: null,
  operations: 'write',
  dashboard: 'read',
}
```

---

### **4. PURCHASING STAFF**
**Who:** Staff who handle purchasing and procurement  
**Title:** Purchasing Coordinator / Procurement Specialist  
**Access Level:** Inventory + supply room (view/assist)

**Can See:**
- ✅ Inventory (view levels, reorder recommendations)
- ✅ Supply Room (view requests, assist with fulfillment)
- ✅ Supply Requests (view to understand needs)
- ✅ Dashboard (purchasing metrics)
- ✅ Their own profile

**Cannot See:**
- ❌ Supply Orders (Court Aides handle this)
- ❌ Keys Management
- ❌ Occupants Management
- ❌ Spaces Management
- ❌ Court Operations
- ❌ Lighting Management
- ❌ Admin functions

**Navigation:**
- Dashboard (Purchasing view)
- Inventory (view only)
  - Stock Levels
  - Reorder Recommendations
  - Low Stock Alerts
- Supply Room (view/assist)
  - View Requests
  - Assist with Fulfillment
- Supply Requests (view)
  - Pending Requests
  - Approved Requests
- Operations (limited)
  - Report Issues
- Profile

**Specific Permissions:**
```typescript
purchasing_staff: {
  spaces: null,
  issues: 'write',                 // Can report issues
  occupants: 'read',               // View requester info
  inventory: 'read',               // Can view inventory
  supply_requests: 'read',         // Can view requests
  supply_orders: null,             // No order management (Court Aides do this)
  supply_room: 'read',             // Can view/assist (NEW)
  keys: null,
  lighting: null,
  maintenance: null,
  court_operations: null,
  operations: 'write',
  dashboard: 'read',
}
```

---

### **5. REGULAR USER (Standard Court Employee)**
**Who:** Judges, clerks, court officers, bailiffs, reporters, etc.  
**Title:** Various court positions  
**Access Level:** Basic user functions

**Can See:**
- ✅ User Dashboard
- ✅ Submit Supply Requests
- ✅ Report Issues
- ✅ View Their Requests/Issues
- ✅ Their own profile

**Cannot See:**
- ❌ Keys Management
- ❌ Occupants Management
- ❌ Spaces Management
- ❌ Court Operations (management)
- ❌ Lighting Management
- ❌ Inventory Management
- ❌ Supply Room
- ❌ Supply Orders
- ❌ Admin functions

**Navigation:**
- Dashboard (User view)
- My Requests
  - Supply Requests
  - Key Requests
- My Issues
  - Reported Issues
  - Maintenance Requests
- Profile

**Specific Permissions:**
```typescript
standard: {
  spaces: null,
  issues: 'write',                 // Can report issues
  occupants: null,
  inventory: null,
  supply_requests: 'write',        // Can submit requests
  supply_orders: null,
  keys: null,
  lighting: null,
  maintenance: null,
  court_operations: null,
  operations: null,
  dashboard: 'read',
}
```

---

## 📊 **Access Matrix**

| Module | Admin | CMC | Court Aide | Purchasing | Regular User |
|--------|-------|-----|------------|------------|--------------|
| **Dashboard** | Admin View | CMC View | Court Aide View | Purchasing View | User View |
| **Spaces** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Court Operations** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None |
| **Issues** | ✅ Full | ✅ Write | ✅ Write | ✅ Write | ✅ Write |
| **Maintenance** | ✅ Full | ✅ Read | ❌ None | ❌ None | ❌ None |
| **Supply Requests** | ✅ Full | ✅ Write | ✅ Admin | ✅ Read | ✅ Write |
| **Supply Orders** | ✅ Full | ❌ None | ✅ Admin | ❌ None | ❌ None |
| **Supply Room** | ✅ Full | ❌ None | ✅ Admin | ✅ Read | ❌ None |
| **Inventory** | ✅ Full | ❌ None | ✅ Admin | ✅ Read | ❌ None |
| **Keys** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Occupants** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Lighting** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Operations Hub** | ✅ Full | ✅ Limited | ✅ Limited | ✅ Limited | ❌ None |

**Legend:**
- ✅ **Full** = Complete CRUD access
- ✅ **Admin** = Full management access
- ✅ **Write** = Can create and update
- ✅ **Read** = View only
- ✅ **Limited** = Specific subset of features
- ❌ **None** = No access

---

## 🔧 **Implementation Strategy**

### **Phase 1: Update Role Types** ✅
**File:** `src/hooks/useRolePermissions.ts`

**Add New Roles:**
```typescript
export type CourtRole = 
  // Existing roles
  | 'admin'
  | 'facilities_manager'
  | 'supply_room_staff'
  | 'judge'
  | 'clerk'
  | 'sergeant'
  // ... other existing roles
  
  // NEW ROLES
  | 'cmc'                    // Court Management Coordinator
  | 'purchasing_staff'       // Purchasing/Procurement
  | 'standard';              // Regular users
```

**Add New Permission:**
```typescript
export interface RolePermissions {
  spaces: PermissionLevel | null;
  issues: PermissionLevel | null;
  occupants: PermissionLevel | null;
  inventory: PermissionLevel | null;
  supply_requests: PermissionLevel | null;
  supply_orders: PermissionLevel | null;  // NEW
  keys: PermissionLevel | null;
  lighting: PermissionLevel | null;
  maintenance: PermissionLevel | null;
  court_operations: PermissionLevel | null;
  operations: PermissionLevel | null;
  dashboard: PermissionLevel | null;
}
```

---

### **Phase 2: Define Role Permissions**

**Add to rolePermissionsMap:**
```typescript
const rolePermissionsMap: Record<CourtRole, RolePermissions> = {
  // ... existing roles ...
  
  cmc: {
    spaces: null,
    issues: 'write',
    occupants: null,
    inventory: null,
    supply_requests: 'write',
    supply_orders: null,
    keys: null,
    lighting: null,
    maintenance: 'read',
    court_operations: 'admin',
    operations: 'write',
    dashboard: 'read',
  },
  
  purchasing_staff: {
    spaces: null,
    issues: 'write',
    occupants: null,
    inventory: 'read',
    supply_requests: 'read',
    supply_orders: 'admin',
    keys: null,
    lighting: null,
    maintenance: null,
    court_operations: null,
    operations: 'write',
    dashboard: 'read',
  },
  
  // supply_room_staff already exists, update if needed
  supply_room_staff: {
    spaces: null,
    issues: 'write',
    occupants: 'read',
    inventory: 'admin',
    supply_requests: 'admin',
    supply_orders: null,
    keys: null,
    lighting: null,
    maintenance: null,
    court_operations: null,
    operations: 'read',
    dashboard: 'read',
  },
  
  // standard already exists
  standard: {
    spaces: null,
    issues: 'write',
    occupants: null,
    inventory: null,
    supply_requests: 'write',
    supply_orders: null,
    keys: null,
    lighting: null,
    maintenance: null,
    court_operations: null,
    operations: null,
    dashboard: 'read',
  },
};
```

---

### **Phase 3: Create Role-Specific Dashboards**

#### **A. CMC Dashboard**
**File:** `src/pages/CMCDashboard.tsx` (NEW)

**Features:**
- Court operations overview
- Courtroom status grid
- Judge assignments
- Pending issues
- Supply request status
- Quick actions

#### **B. Purchasing Dashboard**
**File:** `src/pages/PurchasingDashboard.tsx` (NEW)

**Features:**
- Pending orders
- Budget tracking
- Vendor management
- Low stock alerts
- Order history
- Quick create order

#### **C. Supply Room Dashboard**
**File:** `src/components/supply/SupplyRoomDashboard.tsx` (EXISTS)

**Already Implemented:**
- Pending requests
- Fulfillment workflow
- Inventory management
- Request history

#### **D. User Dashboard**
**File:** `src/pages/UserDashboard.tsx` (EXISTS)

**Already Implemented:**
- My requests
- My issues
- Quick actions
- Status tracking

---

### **Phase 4: Update Navigation**

**File:** `src/components/layout/config/navigation.tsx`

**Strategy:** Dynamic navigation based on role

```typescript
export const getNavigationForRole = (role: CourtRole): NavigationItem[] => {
  switch (role) {
    case 'admin':
      return ADMIN_NAVIGATION;
      
    case 'cmc':
      return CMC_NAVIGATION;
      
    case 'purchasing_staff':
      return PURCHASING_NAVIGATION;
      
    case 'supply_room_staff':
      return SUPPLY_ROOM_NAVIGATION;
      
    case 'standard':
    default:
      return USER_NAVIGATION;
  }
};
```

**CMC Navigation:**
```typescript
const CMC_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', path: '/cmc-dashboard', icon: Home },
  { label: 'Court Operations', path: '/court-operations', icon: Gavel },
  { label: 'My Requests', path: '/my-requests', icon: FileText },
  { label: 'My Issues', path: '/my-issues', icon: AlertCircle },
  { label: 'Profile', path: '/profile', icon: User },
];
```

**Purchasing Navigation:**
```typescript
const PURCHASING_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', path: '/purchasing-dashboard', icon: Home },
  { label: 'Supply Orders', path: '/supply-orders', icon: ShoppingCart },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Supply Requests', path: '/supply-requests', icon: FileText },
  { label: 'Profile', path: '/profile', icon: User },
];
```

**Supply Room Navigation:**
```typescript
const SUPPLY_ROOM_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', path: '/supply-room-dashboard', icon: Home },
  { label: 'Supply Room', path: '/supply-room', icon: Package },
  { label: 'Inventory', path: '/inventory', icon: Warehouse },
  { label: 'Profile', path: '/profile', icon: User },
];
```

**User Navigation:**
```typescript
const USER_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'My Requests', path: '/my-requests', icon: FileText },
  { label: 'My Issues', path: '/my-issues', icon: AlertCircle },
  { label: 'Profile', path: '/profile', icon: User },
];
```

---

### **Phase 5: Route Protection**

**File:** `src/App.tsx`

**Add Role-Based Route Guards:**
```typescript
// CMC Routes
<Route
  path="/cmc-dashboard"
  element={
    <ProtectedRoute requiredPermission="court_operations" level="admin">
      <CMCDashboard />
    </ProtectedRoute>
  }
/>

// Purchasing Routes
<Route
  path="/purchasing-dashboard"
  element={
    <ProtectedRoute requiredPermission="supply_orders" level="admin">
      <PurchasingDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/supply-orders"
  element={
    <ProtectedRoute requiredPermission="supply_orders" level="admin">
      <SupplyOrders />
    </ProtectedRoute>
  }
/>

// Supply Room Routes (already exists)
<Route
  path="/supply-room"
  element={
    <ProtectedRoute requiredPermission="supply_requests" level="admin">
      <SupplyRoom />
    </ProtectedRoute>
  }
/>

// User Routes
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <UserDashboard />
    </ProtectedRoute>
  }
/>
```

---

### **Phase 6: Database Updates**

**Update profiles table role field:**
```sql
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin',
  'cmc',
  'purchasing_staff',
  'supply_room_staff',
  'facilities_manager',
  'judge',
  'clerk',
  'sergeant',
  'court_officer',
  'bailiff',
  'court_reporter',
  'administrative_assistant',
  'court_aide',
  'standard'
));
```

---

## 🎯 **User Flows**

### **CMC User Flow:**
```
1. Login → CMC Dashboard
2. See court operations overview
3. Manage courtroom assignments
4. View judge schedules
5. Report issues if needed
6. Submit supply requests
7. Check request status
```

### **Purchasing Staff Flow:**
```
1. Login → Purchasing Dashboard
2. See pending orders
3. View supply requests needing orders
4. Create purchase orders
5. Track order status
6. Check inventory levels
7. Manage vendors
```

### **Supply Room Staff Flow:**
```
1. Login → Supply Room Dashboard
2. See pending requests
3. Fulfill approved requests
4. Update inventory
5. Manage stock levels
6. Generate reports
```

### **Regular User Flow:**
```
1. Login → User Dashboard
2. See personal overview
3. Submit supply request
4. Report issue
5. Check request status
6. View issue updates
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Core Setup** (2-3 hours)
- [ ] Update CourtRole type with new roles
- [ ] Add supply_orders permission
- [ ] Define role permissions for CMC
- [ ] Define role permissions for purchasing_staff
- [ ] Update supply_room_staff permissions
- [ ] Test role permission logic

### **Phase 2: Dashboards** (4-6 hours)
- [ ] Create CMCDashboard component
- [ ] Create PurchasingDashboard component
- [ ] Verify SupplyRoomDashboard exists
- [ ] Verify UserDashboard exists
- [ ] Add role-specific widgets
- [ ] Test dashboard access

### **Phase 3: Navigation** (2-3 hours)
- [ ] Create getNavigationForRole function
- [ ] Define CMC navigation
- [ ] Define purchasing navigation
- [ ] Define supply room navigation
- [ ] Define user navigation
- [ ] Update navigation component
- [ ] Test navigation switching

### **Phase 4: Routes** (2-3 hours)
- [ ] Add CMC routes
- [ ] Add purchasing routes
- [ ] Add supply orders page
- [ ] Update route protection
- [ ] Test route access
- [ ] Verify redirects

### **Phase 5: Database** (1 hour)
- [ ] Update role constraint
- [ ] Create migration
- [ ] Test role assignment
- [ ] Verify RLS policies

### **Phase 6: Testing** (2-3 hours)
- [ ] Test admin access
- [ ] Test CMC access
- [ ] Test purchasing access
- [ ] Test supply room access
- [ ] Test regular user access
- [ ] Test role switching
- [ ] Verify no unauthorized access

---

## 🚀 **Deployment Strategy**

### **Week 1: Foundation**
- Day 1-2: Update role types and permissions
- Day 3: Database migration
- Day 4-5: Create dashboards

### **Week 2: Integration**
- Day 1-2: Update navigation
- Day 3: Add route protection
- Day 4-5: Testing and refinement

### **Week 3: Polish**
- Day 1-2: UI polish
- Day 3: Documentation
- Day 4: User acceptance testing
- Day 5: Production deployment

---

## 💡 **Key Considerations**

### **Security:**
- ✅ All routes protected by role
- ✅ Navigation filtered by permission
- ✅ API calls check permissions
- ✅ RLS policies enforce at database level

### **User Experience:**
- ✅ Each role sees only relevant features
- ✅ Clear, focused navigation
- ✅ Role-appropriate dashboards
- ✅ No confusing options

### **Maintainability:**
- ✅ Centralized permission logic
- ✅ Easy to add new roles
- ✅ Clear documentation
- ✅ Type-safe implementation

---

**Status:** 📋 **STRATEGIC PLAN COMPLETE**  
**Next Step:** Begin Phase 1 implementation  
**Estimated Total Time:** 2-3 weeks
