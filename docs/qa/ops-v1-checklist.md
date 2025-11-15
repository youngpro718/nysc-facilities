# Operations v1 QA Checklist

**Project:** NYSC Facilities Management System  
**Version:** 1.0.0  
**Date:** October 25, 2025  
**Epic:** [EPIC-003](../epics/epic-003-ops-module-v1.md) - Operations Module v1  
**QA Focus:** Complete Ops v1 Flow Testing

---

## 📋 Overview

This checklist covers the complete Operations v1 flow:
**Read Room → Update Status → Write Audit Log → Refresh View**

Testing includes:
- Happy path scenarios
- Edge cases
- Error handling
- RBAC enforcement
- Audit trail verification
- Performance validation

---

## 🎯 Acceptance Criteria

### **Epic-Level Acceptance Criteria**

- [ ] User can view room details in slide-in panel
- [ ] User can update room status (if authorized)
- [ ] Status update completes in < 500ms
- [ ] Audit log records all status changes
- [ ] Permissions enforced at all layers
- [ ] Toast notifications provide clear feedback
- [ ] Optimistic updates work correctly
- [ ] View refreshes automatically after update
- [ ] Error messages are user-friendly
- [ ] All tests passing (unit, integration, E2E)

---

## 🧪 Test Scenarios

### **Scenario 1: Happy Path - Status Update (Administrator)**

**Given:** User is logged in as Administrator  
**When:** User updates room status from "Available" to "Maintenance"  
**Then:** Status update succeeds with audit trail

#### Test Steps:
1. [ ] Login as Administrator
2. [ ] Navigate to Operations page (`/ops`)
3. [ ] Click on a room card (e.g., Room 101)
4. [ ] Verify room detail panel slides in from right
5. [ ] Verify current status displays as "Available"
6. [ ] Click "Update Status" button
7. [ ] Verify status update modal opens
8. [ ] Select "Maintenance" from dropdown
9. [ ] Enter notes: "Scheduled HVAC maintenance"
10. [ ] Click "Update Status" button
11. [ ] Verify success toast appears: "Status updated successfully"
12. [ ] Verify modal closes
13. [ ] Verify room panel shows new status: "Maintenance"
14. [ ] Switch to "History" tab
15. [ ] Verify audit entry appears with:
    - User: Administrator email
    - Timestamp: Current time
    - Change: Available → Maintenance
    - Notes: "Scheduled HVAC maintenance"

**Expected Results:**
- ✅ Status updates in < 500ms
- ✅ Optimistic update shows immediately
- ✅ Success toast displays
- ✅ Audit log entry created
- ✅ View refreshes with new data
- ✅ No console errors

---

### **Scenario 2: Happy Path - Status Update (Facilities Staff)**

**Given:** User is logged in as Facilities Staff  
**When:** User updates room status  
**Then:** Status update succeeds (same as Administrator)

#### Test Steps:
1. [ ] Login as Facilities Staff
2. [ ] Navigate to Operations page
3. [ ] Click on a room card
4. [ ] Click "Update Status" button
5. [ ] Select new status
6. [ ] Click "Update Status"
7. [ ] Verify success toast
8. [ ] Verify status updated
9. [ ] Verify audit trail entry

**Expected Results:**
- ✅ Facilities Staff can update status
- ✅ Same flow as Administrator
- ✅ Audit log shows Facilities Staff as user

---

### **Scenario 3: Permission Denied - Status Update (Staff)**

**Given:** User is logged in as Staff (no update permission)  
**When:** User attempts to update room status  
**Then:** Update button is disabled/hidden

#### Test Steps:
1. [ ] Login as Staff user
2. [ ] Navigate to Operations page
3. [ ] Click on a room card
4. [ ] Verify room detail panel opens
5. [ ] Verify "Update Status" button is:
    - [ ] Disabled (grayed out), OR
    - [ ] Hidden (not visible)
6. [ ] Attempt to call API directly (dev tools)
7. [ ] Verify error: "Permission denied"
8. [ ] Verify no status change occurs
9. [ ] Verify no audit log entry created

**Expected Results:**
- ✅ UI prevents unauthorized action
- ✅ API rejects unauthorized request
- ✅ Clear error message
- ✅ No data changes
- ✅ Security maintained

---

### **Scenario 4: Edge Case - Room Not Found**

**Given:** User attempts to update non-existent room  
**When:** API called with invalid room ID  
**Then:** Error handled gracefully

#### Test Steps:
1. [ ] Login as Administrator
2. [ ] Manually call API with invalid room ID
3. [ ] Verify error toast: "Room not found"
4. [ ] Verify no audit log entry created
5. [ ] Verify UI state unchanged
6. [ ] Verify no console errors (handled gracefully)

**Expected Results:**
- ✅ Error caught and handled
- ✅ User-friendly error message
- ✅ No data corruption
- ✅ UI remains stable

---

### **Scenario 5: Edge Case - Network Error**

**Given:** Network connection fails during update  
**When:** User attempts to update status  
**Then:** Error handled with retry option

#### Test Steps:
1. [ ] Login as Administrator
2. [ ] Open DevTools Network tab
3. [ ] Set network to "Offline"
4. [ ] Attempt to update room status
5. [ ] Verify error toast: "Network error. Please try again"
6. [ ] Verify optimistic update rolls back
7. [ ] Verify original status restored
8. [ ] Set network to "Online"
9. [ ] Click retry (if available)
10. [ ] Verify update succeeds

**Expected Results:**
- ✅ Network error detected
- ✅ Optimistic update rolled back
- ✅ Clear error message
- ✅ Retry mechanism works
- ✅ Data consistency maintained

---

### **Scenario 6: Edge Case - Concurrent Updates**

**Given:** Two users update same room simultaneously  
**When:** Both submit status changes  
**Then:** Last write wins, both changes logged

#### Test Steps:
1. [ ] Open two browser windows
2. [ ] Login as different users in each
3. [ ] Both navigate to same room
4. [ ] User A: Start status update (don't submit)
5. [ ] User B: Update status to "Maintenance" (submit)
6. [ ] User A: Update status to "Closed" (submit)
7. [ ] Verify final status is "Closed" (last write)
8. [ ] Verify audit trail shows both changes:
    - User B: Available → Maintenance
    - User A: Maintenance → Closed
9. [ ] Verify both users see updated status

**Expected Results:**
- ✅ No data loss
- ✅ Both changes logged
- ✅ Last write wins
- ✅ Audit trail accurate
- ✅ Both users synchronized

---

### **Scenario 7: Edge Case - Audit Log Failure**

**Given:** Audit log insert fails (database issue)  
**When:** User updates room status  
**Then:** Status update succeeds, error logged

#### Test Steps:
1. [ ] Mock audit_logs table to fail insert
2. [ ] Login as Administrator
3. [ ] Update room status
4. [ ] Verify status update succeeds
5. [ ] Verify success toast appears
6. [ ] Check console for audit log error
7. [ ] Verify room status changed
8. [ ] Verify audit log entry missing (expected)

**Expected Results:**
- ✅ Status update not blocked
- ✅ Error logged to console
- ✅ User notified of success
- ✅ Graceful degradation
- ✅ Core functionality maintained

---

### **Scenario 8: Edge Case - Invalid Status Transition**

**Given:** User attempts invalid status change  
**When:** Validation rules prevent transition  
**Then:** Error message explains why

#### Test Steps:
1. [ ] Login as Administrator
2. [ ] Navigate to room with status "Under Construction"
3. [ ] Attempt to change to "Available" (if invalid)
4. [ ] Verify validation error
5. [ ] Verify status unchanged
6. [ ] Verify no audit log entry

**Expected Results:**
- ✅ Validation enforced
- ✅ Clear error message
- ✅ No invalid state
- ✅ Data integrity maintained

---

### **Scenario 9: Performance - Rapid Status Updates**

**Given:** User updates status multiple times quickly  
**When:** Rapid clicks on update button  
**Then:** All updates processed correctly

#### Test Steps:
1. [ ] Login as Administrator
2. [ ] Update room status
3. [ ] Immediately update again (different status)
4. [ ] Repeat 5 times rapidly
5. [ ] Verify all updates complete
6. [ ] Verify audit trail shows all changes
7. [ ] Verify final status is correct
8. [ ] Verify no race conditions
9. [ ] Verify no duplicate entries

**Expected Results:**
- ✅ All updates processed
- ✅ No race conditions
- ✅ Audit trail complete
- ✅ Performance acceptable
- ✅ No data corruption

---

### **Scenario 10: Audit Trail - Pagination**

**Given:** Room has > 20 status changes  
**When:** User views audit trail  
**Then:** Pagination works correctly

#### Test Steps:
1. [ ] Create room with 25+ status changes
2. [ ] Login as Administrator
3. [ ] Open room detail panel
4. [ ] Switch to "History" tab
5. [ ] Verify first 20 entries display
6. [ ] Verify "Load More" button appears
7. [ ] Click "Load More"
8. [ ] Verify next 5 entries load
9. [ ] Verify no duplicates
10. [ ] Verify chronological order maintained

**Expected Results:**
- ✅ Pagination works
- ✅ 20 entries per page
- ✅ Load more functional
- ✅ No duplicates
- ✅ Correct order

---

## 🔐 RBAC Testing Matrix

### **Permission Matrix Verification**

| Role | View Details | Update Status | Edit Room | Delete Room | View Audit |
|------|:------------:|:-------------:|:---------:|:-----------:|:----------:|
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Facilities Staff** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Staff** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User** | Own Only | ❌ | ❌ | ❌ | ❌ |

### **RBAC Test Cases**

#### Test 1: Administrator Permissions
- [ ] Can view all rooms
- [ ] Can update any room status
- [ ] Can edit room details
- [ ] Can delete rooms
- [ ] Can view audit trail
- [ ] No permission errors

#### Test 2: Manager Permissions
- [ ] Can view all rooms
- [ ] Can update room status
- [ ] Can edit room details
- [ ] Cannot delete rooms (button hidden/disabled)
- [ ] Can view audit trail
- [ ] Delete attempt shows error

#### Test 3: Facilities Staff Permissions
- [ ] Can view all rooms
- [ ] Can update room status
- [ ] Cannot edit room details (button hidden/disabled)
- [ ] Cannot delete rooms
- [ ] Can view audit trail
- [ ] Edit attempt shows error

#### Test 4: Staff Permissions
- [ ] Can view all rooms
- [ ] Cannot update room status (button hidden/disabled)
- [ ] Cannot edit room details
- [ ] Cannot delete rooms
- [ ] Cannot view audit trail (tab hidden)
- [ ] Update attempt shows error

#### Test 5: User Permissions
- [ ] Can only view own issues/rooms
- [ ] Cannot update any room status
- [ ] Cannot edit any room details
- [ ] Cannot delete any rooms
- [ ] Cannot view audit trail
- [ ] All actions show permission error

---

## 📊 Performance Testing

### **Performance Benchmarks**

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| Panel Load | < 300ms | < 500ms | > 500ms |
| Status Update | < 500ms | < 1s | > 1s |
| Audit Trail Load | < 400ms | < 600ms | > 600ms |
| Permission Check | < 50ms | < 100ms | > 100ms |
| Optimistic Update | < 50ms | < 100ms | > 100ms |

### **Performance Test Cases**

#### Test 1: Panel Load Time
1. [ ] Open room detail panel
2. [ ] Measure time from click to display
3. [ ] Verify < 300ms (target)
4. [ ] Test with slow 3G network
5. [ ] Verify < 500ms (acceptable)

#### Test 2: Status Update Time
1. [ ] Click "Update Status"
2. [ ] Measure time from submit to success toast
3. [ ] Verify < 500ms (target)
4. [ ] Test with 10 concurrent updates
5. [ ] Verify all complete in < 1s

#### Test 3: Audit Trail Load Time
1. [ ] Switch to "History" tab
2. [ ] Measure time to display entries
3. [ ] Verify < 400ms (target)
4. [ ] Test with 100+ entries
5. [ ] Verify pagination doesn't slow down

---

## 🧩 Integration Testing

### **Integration Test Scenarios**

#### Test 1: End-to-End Flow
```
Login → Navigate → View Room → Update Status → Verify Audit → Logout
```
- [ ] Complete flow works without errors
- [ ] All data persists correctly
- [ ] Session maintained throughout
- [ ] No memory leaks
- [ ] Clean logout

#### Test 2: Multi-User Scenario
```
User A updates → User B views → User B sees change
```
- [ ] Real-time updates work (or refresh)
- [ ] Both users see same data
- [ ] No stale data displayed
- [ ] Audit trail synchronized

#### Test 3: Cross-Module Integration
```
Update in Ops → Verify in Facilities → Check Dashboard Stats
```
- [ ] Status change reflects everywhere
- [ ] Dashboard stats update
- [ ] Facilities view updates
- [ ] No data inconsistency

---

## 🐛 Error Handling Testing

### **Error Scenarios**

#### Error 1: Database Connection Lost
- [ ] Error caught gracefully
- [ ] User-friendly message displayed
- [ ] Retry mechanism available
- [ ] No data corruption
- [ ] Application remains stable

#### Error 2: Session Expired
- [ ] User redirected to login
- [ ] Pending changes not lost (if possible)
- [ ] Clear message: "Session expired"
- [ ] Re-login works
- [ ] Can resume work

#### Error 3: Invalid Data Format
- [ ] Validation catches bad data
- [ ] Clear error message
- [ ] No database writes
- [ ] Form state preserved
- [ ] User can correct and retry

#### Error 4: RLS Policy Violation
- [ ] Permission error caught
- [ ] Specific error message
- [ ] No data exposed
- [ ] User informed of restriction
- [ ] Audit log records attempt

---

## 📱 Responsive Design Testing

### **Device Testing**

#### Desktop (1920x1080)
- [ ] Panel slides in from right (400px width)
- [ ] All content visible
- [ ] No horizontal scroll
- [ ] Buttons accessible
- [ ] Tabs work correctly

#### Tablet (768x1024)
- [ ] Panel width adjusts (300px)
- [ ] Content readable
- [ ] Touch targets adequate (44px min)
- [ ] Scrolling smooth
- [ ] Landscape mode works

#### Mobile (375x667)
- [ ] Panel full screen
- [ ] Close button visible
- [ ] Form inputs accessible
- [ ] Keyboard doesn't obscure content
- [ ] Swipe to close works

---

## ♿ Accessibility Testing

### **WCAG 2.1 Level AA Compliance**

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modal/panel
- [ ] Focus visible on all elements
- [ ] No keyboard traps

#### Screen Reader
- [ ] Panel announces when opened
- [ ] Status change announced
- [ ] Error messages read aloud
- [ ] Form labels associated
- [ ] ARIA labels present

#### Color Contrast
- [ ] Text meets 4.5:1 ratio
- [ ] Status badges readable
- [ ] Error messages visible
- [ ] Focus indicators clear
- [ ] Works in high contrast mode

---

## 🔍 Security Testing

### **Security Test Cases**

#### Test 1: SQL Injection
- [ ] Try SQL in status field
- [ ] Try SQL in notes field
- [ ] Verify input sanitized
- [ ] No database errors
- [ ] No data exposed

#### Test 2: XSS Attack
- [ ] Try `<script>` in notes
- [ ] Try `javascript:` in fields
- [ ] Verify output escaped
- [ ] No script execution
- [ ] Content displayed safely

#### Test 3: CSRF Protection
- [ ] Verify CSRF token present
- [ ] Try request without token
- [ ] Verify request rejected
- [ ] Session maintained
- [ ] No unauthorized actions

#### Test 4: Permission Bypass
- [ ] Try API call without auth
- [ ] Try API call with wrong role
- [ ] Try direct database access
- [ ] Verify all rejected
- [ ] Audit log records attempts

---

## 📋 Test Execution Checklist

### **Pre-Test Setup**
- [ ] Test environment configured
- [ ] Test data seeded
- [ ] User accounts created (all roles)
- [ ] Database backed up
- [ ] Monitoring enabled

### **Test Execution**
- [ ] All happy path scenarios pass
- [ ] All edge cases handled
- [ ] All RBAC tests pass
- [ ] Performance benchmarks met
- [ ] Integration tests pass
- [ ] Error handling verified
- [ ] Responsive design works
- [ ] Accessibility compliant
- [ ] Security tests pass

### **Post-Test**
- [ ] Test results documented
- [ ] Bugs logged in tracker
- [ ] Performance metrics recorded
- [ ] Screenshots captured
- [ ] Test data cleaned up

---

## 📊 Test Results Template

### **Test Run Information**
- **Date:** [Date]
- **Tester:** [Name]
- **Environment:** [Dev/Staging/Production]
- **Browser:** [Chrome/Firefox/Safari]
- **Version:** [Version Number]

### **Results Summary**

| Category | Total | Passed | Failed | Blocked | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Happy Path | 2 | | | | |
| Edge Cases | 7 | | | | |
| RBAC | 5 | | | | |
| Performance | 3 | | | | |
| Integration | 3 | | | | |
| Error Handling | 4 | | | | |
| Responsive | 3 | | | | |
| Accessibility | 3 | | | | |
| Security | 4 | | | | |
| **TOTAL** | **34** | | | | |

### **Critical Issues Found**
1. [Issue description]
2. [Issue description]

### **Non-Critical Issues Found**
1. [Issue description]
2. [Issue description]

### **Recommendations**
1. [Recommendation]
2. [Recommendation]

---

## 🎯 Sign-Off Criteria

### **Ops v1 is ready for production when:**

- [ ] All happy path scenarios pass (100%)
- [ ] All edge cases handled (100%)
- [ ] RBAC enforced correctly (100%)
- [ ] Performance targets met (95%+)
- [ ] Integration tests pass (100%)
- [ ] Error handling verified (100%)
- [ ] Responsive design works (all devices)
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] Security tests pass (100%)
- [ ] No critical bugs
- [ ] < 3 non-critical bugs
- [ ] Documentation complete
- [ ] Stakeholder approval

---

## 📞 Support & Resources

### **Documentation**
- **Epic 003:** `/docs/epics/epic-003-ops-module-v1.md`
- **Stories:** `/docs/stories/story-009-*.md` through `story-013-*.md`
- **Architecture:** `/docs/epics/epic-002-ui-architecture.md`

### **Test Data**
- **Test Users:** See `/docs/qa/test-users.md`
- **Test Rooms:** See `/docs/qa/test-data.md`
- **API Endpoints:** See `/docs/api/endpoints.md`

### **Tools**
- **Browser DevTools:** Network, Console, Performance tabs
- **React Query DevTools:** Query inspection
- **Accessibility:** axe DevTools, WAVE
- **Performance:** Lighthouse, WebPageTest

---

**QA Lead:** QA Team  
**Last Updated:** October 25, 2025  
**Version:** 1.0.0  
**Status:** Active Testing
