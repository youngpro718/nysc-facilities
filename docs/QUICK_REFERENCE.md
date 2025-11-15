# 🚀 NYSC Facilities Hub - Quick Reference Guide

## 📍 Application URLs

### Development
- **Local:** http://localhost:8080
- **Network:** http://192.168.1.183:8080

### Production
- **Live Site:** https://nysc-facilities.windsurf.build
- **Netlify Dashboard:** https://app.netlify.com/projects/nysc-facilities-s8u8g

---

## 🗺️ Page Navigation Map

### Admin Routes (Require Admin Role)
```
/ ........................... Admin Dashboard (Main hub)
/spaces ..................... Spaces Management (Rooms, floors, buildings)
/operations ................. Operations Hub (Issues, maintenance, supplies)
/occupants .................. Personnel Management (Staff, assignments)
/court-operations ........... Court Operations (Terms, assignments, shutdowns)
/keys ....................... Keys Management (Inventory, requests, orders)
/inventory .................. Inventory Management (Stock, categories, analytics)
/lighting ................... Lighting Management (Fixtures, zones)
/admin-profile .............. Admin Settings (Users, roles, modules)
/system-settings ............ System Configuration
/access-management .......... User Access Control
```

### User Routes (Regular Users)
```
/dashboard .................. User Dashboard (Personal overview)
/my-requests ................ My Requests (Keys, supplies)
/my-issues .................. My Issues (Reported problems)
/profile .................... User Profile Settings
/supply-room ................ Supply Room (Permission-based)
```

### Public Routes
```
/login ...................... Authentication
/public-forms ............... Public Form Directory
/forms/key-request .......... Key Request Form
/forms/supply-request ....... Supply Request Form
/forms/maintenance-request .. Maintenance Request Form
/forms/issue-report ......... Issue Report Form
```

---

## 🔑 Key Features by Module

### 📦 Spaces Management
- **Create/Edit Rooms** - Comprehensive room management
- **Floor Plans** - 2D and 3D visualization
- **Building Hierarchy** - Buildings → Floors → Rooms
- **Room Assignments** - Occupant tracking
- **Capacity Management** - Space utilization

**Quick Actions:**
- Create Room: Click "+" button in Spaces page
- Edit Room: Click room card → Edit button
- View Floor Plan: Click "Floor Plan" tab
- Filter by Building: Use building dropdown

### ⚠️ Operations Hub
- **Issues Tracking** - Facility problems
- **Maintenance Scheduling** - Planned maintenance
- **Supply Requests** - Request oversight
- **Analytics** - Operational metrics
- **Building Filters** - Location-based views

**Quick Actions:**
- Report Issue: Click "Report Issue" button
- Update Status: Click issue card → Status dropdown
- View Analytics: Click "Analytics" tab
- Filter by Building: Toggle building buttons

### ⚖️ Court Operations
- **Courtroom Status** - 32 courtrooms tracked
- **Term Assignments** - Judge/staff assignments
- **Room Shutdowns** - Maintenance tracking
- **Personnel Selection** - Dropdown-based assignment
- **Temporary Locations** - Relocation management

**Quick Actions:**
- Upload Term: Click "Upload Term" button
- Assign Personnel: Go to Assignments tab → Select from dropdowns
- Track Shutdowns: Click "Room Shutdowns" tab
- Set Temp Location: Click courtroom → "Set Temporary Location"

### 👥 Occupants Management
- **Personnel Directory** - 95+ court personnel
- **Room Assignments** - Assignment tracking
- **Key Assignments** - Key distribution
- **Search & Filter** - Find personnel quickly
- **Export/Import** - Bulk operations

**Quick Actions:**
- Add Occupant: Click "Add Occupant" button
- Assign Room: Click occupant → "Assign Room"
- Assign Key: Click occupant → "Assign Key"
- Export CSV: Click "Export" button

### 🔑 Keys Management
- **Key Inventory** - 8 keys tracked
- **Key Requests** - 6 active requests
- **Key Orders** - 5 orders in system
- **Assignments** - 11 active assignments
- **Audit Logs** - 27 log entries

**Quick Actions:**
- Create Key: Click "Create Key" button
- Process Request: Go to Requests tab → Approve/Reject
- Order Keys: Click "Create Order" button
- View History: Click "History" tab

### 📦 Inventory Management
- **Stock Tracking** - Real-time inventory
- **Low Stock Alerts** - Automatic warnings
- **Categories** - Organized inventory
- **Reorder Recommendations** - Smart suggestions
- **Analytics** - Usage trends

**Quick Actions:**
- Add Item: Click "Add Item" button
- Update Stock: Click item → Edit quantity
- View Low Stock: Check "Low Stock Alerts" panel
- Export Data: Click "Export CSV" button

### 🏪 Supply Room
- **Request Fulfillment** - Process requests
- **Status Tracking** - Request lifecycle
- **Inventory Integration** - Stock checking
- **Analytics** - Usage patterns
- **Cost Tracking** - Budget monitoring

**Quick Actions:**
- Claim Request: Click "Claim" button
- Update Status: Select status → Add notes
- Check Inventory: View stock levels
- View Analytics: Click "Analytics" tab

---

## 🗄️ Database Quick Reference

### Core Tables
```
buildings ................... 2 buildings
  └── floors ................ 15 floors
      └── rooms ............. 94 rooms
          └── issues ........ 2 active issues

profiles .................... Registered users
personnel_profiles .......... 150+ court personnel
occupants ................... Unified personnel view

keys ........................ 8 keys
key_assignments ............. 11 active
key_requests ................ 6 requests
key_orders .................. 5 orders

inventory_items ............. Stock tracking
supply_requests ............. Request management
supply_request_items ........ Request details

court_rooms ................. 32 courtrooms
court_assignments ........... Term assignments
court_terms ................. Term management
room_shutdowns .............. Shutdown tracking
```

### Important Views
```
unified_spaces .............. Combined spatial data
key_inventory_view .......... Aggregated key data
personnel_profiles_view ..... Court personnel
unified_personnel_view ...... All personnel
spaces_dashboard_mv ......... Analytics (materialized)
```

### Key RPC Functions
```
get_dashboard_stats() ....... Admin dashboard data
get_building_hierarchy() .... Spatial structure
create_key_order() .......... Key ordering
process_key_order_receipt() . Key receiving
get_facility_analytics() .... Analytics data
```

---

## 🔐 User Roles & Permissions

### Administrator
- ✅ Full access to all modules
- ✅ User management
- ✅ System settings
- ✅ Security controls
- ✅ Analytics access

### Manager
- ✅ Most modules accessible
- ✅ Limited user management
- ✅ Reporting capabilities
- ❌ System settings
- ❌ Security controls

### Staff
- ✅ Basic operations
- ✅ Issue reporting
- ✅ Request submission
- ❌ User management
- ❌ System settings

### Supply Room Staff
- ✅ Supply room access
- ✅ Inventory management
- ✅ Request fulfillment
- ❌ Other admin features
- ❌ Court operations

### Guest
- ✅ View-only access
- ✅ Public forms
- ❌ Data modification
- ❌ Admin features
- ❌ Sensitive data

---

## 🛠️ Common Development Tasks

### Start Development Server
```bash
cd /Users/jackduhatelier/Downloads/nysc-facilities-main
npm run dev
# Opens at http://localhost:8080
```

### Type Check
```bash
npm run typecheck
# Should show: Exit code: 0 (no errors)
```

### Build for Production
```bash
npm run build
# Output: dist/ directory
```

### Deploy to Netlify
```bash
# Automatic deployment on git push to main
# Or manual: netlify deploy --prod
```

---

## 🐛 Common Issues & Solutions

### Issue: Edit Room Dialog Not Populating
**Solution:** Field mapping normalization needed
**File:** `/src/components/spaces/dialogs/EditSpaceDialog.tsx`
**Status:** Known issue, fix in progress

### Issue: Court Personnel Dropdowns Empty
**Solution:** Check personnel_profiles table has data
**Verify:** Should have 150+ records
**Status:** ✅ Fixed - Now using correct table

### Issue: Import CSV Not Working
**Solution:** Feature not yet implemented
**Status:** Planned enhancement

### Issue: Filters Reset on Building Change
**Solution:** Persist filters in URL params
**Status:** Low priority enhancement

### Issue: CORS Error on Different Port
**Solution:** Ensure dev server runs on port 8080
**Command:** Check vite.config.ts server.port setting

---

## 📊 Performance Metrics

### Current Performance
- **TypeScript Compilation:** < 5 seconds
- **Dev Server Start:** ~1.5 seconds
- **Page Load (First):** ~2 seconds
- **Page Load (Cached):** < 500ms
- **Query Response:** < 200ms (avg)

### Optimization Opportunities
- Bundle size: ~6MB (can be reduced)
- Code splitting: Partial implementation
- Image optimization: Recommended
- Lazy loading: Implemented for major routes

---

## 🔍 Debugging Tips

### React Query DevTools
```typescript
// Already integrated - check browser console
// Shows all queries, mutations, cache state
```

### Supabase Logs
```
// Check Supabase dashboard for:
- Database logs
- Auth logs
- API logs
- Real-time logs
```

### Console Debugging
```typescript
// Common debug patterns in codebase:
console.log('Data loaded:', data);
console.error('Error:', error);
console.warn('Warning:', warning);
```

### Network Debugging
```
// Browser DevTools → Network tab
- Check API calls to Supabase
- Verify authentication headers
- Monitor real-time subscriptions
```

---

## 📞 Support & Resources

### Documentation
- **This Guide:** `/docs/BROWNFIELD_ANALYSIS.md`
- **Quick Reference:** `/docs/QUICK_REFERENCE.md`
- **README:** `/README.md`

### External Resources
- **React Query:** https://tanstack.com/query/latest
- **Supabase:** https://supabase.com/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs

### Repository
- **GitHub:** https://github.com/youngpro718/nysc-facilities.git
- **Branch:** main
- **Issues:** Track via GitHub Issues

---

## ✅ Quick Checklist for New Developers

### Setup (First Time)
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Configure `.env` file (copy from `.env.local.example`)
- [ ] Run `npm run dev`
- [ ] Verify app loads at http://localhost:8080
- [ ] Check TypeScript: `npm run typecheck`

### Daily Development
- [ ] Pull latest changes: `git pull origin main`
- [ ] Start dev server: `npm run dev`
- [ ] Check for TypeScript errors
- [ ] Test changes in browser
- [ ] Commit with descriptive messages
- [ ] Push to GitHub

### Before Deployment
- [ ] Run type check: `npm run typecheck`
- [ ] Test all modified features
- [ ] Check console for errors
- [ ] Verify mobile responsiveness
- [ ] Update documentation if needed
- [ ] Create pull request

---

**Last Updated:** October 25, 2025  
**Maintained By:** Development Team  
**Version:** 1.0.0
