# Admin & User Flow Audit - Improvement Recommendations

## Overview
This document analyzes the app from both admin and user perspectives, identifying practical improvements for each page and workflow.

---

## USER FLOWS

### 1. User Dashboard (`/dashboard`)
**Current State:** Shows user info, supply requests, issues, and keys in tabs.

**Issues Found:**
- ❌ No quick link to create new supply request from dashboard header
- ❌ Issues tab shows minimal info (no priority, location, or progress)
- ❌ No notification count badge visible in header
- ❌ "Report Issue" button could be more prominent

**Recommended Improvements:**
- [ ] Add "New Supply Request" button next to "Report Issue" in header
- [ ] Enhance issue cards with priority badges, location, and estimated resolution time
- [ ] Add notification badge to header showing unread count
- [ ] Add quick stats for "Days since last issue" or "Average resolution time"
- [ ] Add "View All" links at bottom of each tab section

---

### 2. My Supply Requests (`/my-supply-requests`)
**Current State:** Good filtering, pull-to-refresh, error handling.

**Issues Found:**
- ❌ Status filter has many options that may confuse users
- ❌ No estimated delivery/completion time shown
- ❌ No way to contact supply staff about a request
- ❌ "Quick Order" dialog is complex for simple requests

**Recommended Improvements:**
- [ ] Simplify status filter to: Active, Completed, Cancelled
- [ ] Add estimated completion time based on request priority
- [ ] Add "Message Supply Staff" button on pending requests
- [ ] Add "Reorder" button on completed requests
- [ ] Show request timeline/history in expandable section

---

### 3. My Issues (`/my-issues`)
**Current State:** Basic list with status badges.

**Issues Found:**
- ❌ No way to add comments or updates to existing issues
- ❌ No progress indicator for in-progress issues
- ❌ Can't see who is assigned to work on the issue
- ❌ No estimated resolution time

**Recommended Improvements:**
- [ ] Add comment/update functionality for users
- [ ] Show assigned staff member (if any)
- [ ] Add progress bar for in-progress issues
- [ ] Add "Follow Up" button for issues older than X days
- [ ] Show last update timestamp prominently

---

### 4. My Key Requests (`/my-requests`)
**Current State:** Good order tracking with progress bars.

**Issues Found:**
- ❌ Page title says "My Key Requests" but could include other request types
- ❌ No pickup location shown when key is ready
- ❌ No notification preference for pickup readiness

**Recommended Improvements:**
- [ ] Add pickup location and hours when status is "ready_for_pickup"
- [ ] Add "Notify me when ready" toggle
- [ ] Show key return due date if applicable

---

### 5. Profile (`/profile`)
**Current State:** Basic profile with personal info form.

**Issues Found:**
- ❌ No way to see request history summary
- ❌ No quick links to common actions
- ❌ Missing department/room assignment display

**Recommended Improvements:**
- [ ] Add "My Activity" section showing recent requests/issues
- [ ] Add quick stats (total requests, issues resolved, etc.)
- [ ] Show current room/department assignment clearly
- [ ] Add "Change Password" shortcut

---

## ADMIN FLOWS

### 6. Admin Dashboard (`/`)
**Current State:** Shows buildings grid, module cards, issues.

**Issues Found:**
- ❌ No quick stats for pending supply requests
- ❌ No alert for critical issues requiring immediate attention
- ❌ Module cards don't show counts/badges

**Recommended Improvements:**
- [ ] Add alert banner for critical issues (urgent priority, unassigned)
- [ ] Add badge counts to module cards (e.g., "5 pending requests")
- [ ] Add "Today's Activity" summary section
- [ ] Add quick action buttons for common tasks

---

### 7. Operations (`/operations`)
**Current State:** Comprehensive with tabs for overview, issues, maintenance, analytics.

**Issues Found:**
- ❌ Building filter is hardcoded (100 Centre, 111 Centre)
- ❌ "System Performance 98%" is hardcoded, not real data
- ❌ No bulk actions for issues (assign multiple, change status)
- ❌ Quick filter presets could be more useful

**Recommended Improvements:**
- [ ] Fetch building list dynamically from database
- [ ] Calculate real system performance metrics
- [ ] Add bulk selection and actions for issues
- [ ] Add "My Assigned Issues" quick filter
- [ ] Add SLA tracking (issues overdue, approaching deadline)

---

### 8. Inventory Dashboard (`/inventory`)
**Current State:** Recently improved with tabs, search, low stock alerts.

**Issues Found:**
- ✅ Most issues addressed in recent update
- ❌ No barcode scanning for quick lookup
- ❌ No reorder point suggestions based on usage

**Recommended Improvements:**
- [ ] Add barcode/QR code scanning for mobile
- [ ] Add "Suggested Reorder" based on usage patterns
- [ ] Add vendor contact quick-dial for low stock items

---

### 9. Supply Requests Admin (`/admin/supply-requests`)
**Current State:** Good request management with approval workflow.

**Issues Found:**
- ❌ No batch approval for multiple requests
- ❌ No priority queue view (urgent first)
- ❌ No staff assignment for fulfillment
- ❌ No communication log with requester

**Recommended Improvements:**
- [ ] Add batch approve/reject functionality
- [ ] Add "Priority Queue" view sorted by urgency
- [ ] Add staff assignment dropdown for fulfillment
- [ ] Add internal notes/communication thread
- [ ] Add "Print Pick List" for multiple requests

---

### 10. Keys Management (`/keys`)
**Current State:** Key inventory and assignment tracking.

**Issues Found:**
- ❌ No key checkout/return workflow
- ❌ No overdue key alerts
- ❌ No key request queue visible

**Recommended Improvements:**
- [ ] Add "Checkout Key" quick action
- [ ] Add overdue key alerts with user contact info
- [ ] Show pending key requests with approve/deny buttons
- [ ] Add key audit log

---

## CROSS-CUTTING IMPROVEMENTS

### Navigation
- [ ] Add breadcrumbs to all pages (partially done)
- [ ] Add "Back to Dashboard" button on all pages
- [ ] Improve mobile bottom tab bar with badges

### Notifications
- [ ] Add in-app notification center
- [ ] Add email notification preferences per event type
- [ ] Add push notifications for mobile (PWA)

### Search
- [ ] Add global search across all entities
- [ ] Add recent searches history
- [ ] Add search suggestions/autocomplete

### Mobile Experience
- [ ] Ensure all forms work well on mobile
- [ ] Add swipe actions on list items
- [ ] Optimize touch targets (min 44px)

### Performance
- [ ] Add loading skeletons to all pages
- [ ] Implement optimistic updates for common actions
- [ ] Add offline support for viewing data

---

## PRIORITY IMPLEMENTATION ORDER

### Phase 1 - Quick Wins (1-2 days)
1. Add notification badges to dashboard
2. Add "New Supply Request" to user dashboard header
3. Fix hardcoded building filter in Operations
4. Add pickup location to ready key requests

### Phase 2 - User Experience (3-5 days)
1. Add comment functionality to issues
2. Add message/follow-up on supply requests
3. Add progress indicators to issues
4. Simplify status filters

### Phase 3 - Admin Efficiency (5-7 days)
1. Add bulk actions for issues
2. Add batch approval for supply requests
3. Add priority queue views
4. Add staff assignment

### Phase 4 - Advanced Features (7-14 days)
1. Add global search
2. Add barcode scanning
3. Add SLA tracking
4. Add usage-based reorder suggestions

---

## Summary

The app has a solid foundation with good mobile support and real-time updates. The main areas for improvement are:

1. **User Communication** - Users need better ways to track progress and communicate about their requests
2. **Admin Efficiency** - Bulk actions and priority views would significantly speed up admin workflows
3. **Visibility** - Badge counts and alerts would help both users and admins see what needs attention
4. **Simplification** - Some status filters and workflows are overly complex for typical use cases
