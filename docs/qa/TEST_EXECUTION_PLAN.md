# Operations v1 - Test Execution Plan

**Date:** October 26, 2025, 8:13 AM UTC-04:00  
**Epic:** EPIC-003 - Operations Module v1  
**Tester:** QA Team  
**Environment:** Development (http://localhost:8080)  
**Status:** 🚀 **READY TO BEGIN**

---

## 📋 Executive Summary

This plan outlines the systematic testing approach for Operations v1, covering 34 test scenarios across 9 categories. Estimated time: 2-3 hours for complete execution.

---

## 🎯 Testing Objectives

1. ✅ Verify all happy path scenarios work
2. ✅ Validate edge case handling
3. ✅ Confirm RBAC enforcement
4. ✅ Measure performance benchmarks
5. ✅ Test error handling
6. ✅ Verify responsive design
7. ✅ Validate accessibility
8. ✅ Confirm security measures

---

## 📅 Test Schedule

### **Phase 1: Quick Smoke Test (15 minutes)**
- Verify basic functionality works
- Catch any critical blockers
- Confirm environment ready

### **Phase 2: Core Functionality (45 minutes)**
- Happy path scenarios
- RBAC testing
- Basic edge cases

### **Phase 3: Advanced Testing (60 minutes)**
- Performance testing
- Integration testing
- Security testing

### **Phase 4: Polish & Validation (30 minutes)**
- Responsive design
- Accessibility
- Final verification

---

## 🚀 Phase 1: Quick Smoke Test (15 min)

### **Objective:** Verify system is functional

**Prerequisites:**
```bash
# 1. Ensure dev server running
npm run dev
# Server at http://localhost:8080

# 2. Verify you have test accounts
# - Administrator
# - Facilities Staff
# - Staff (no permissions)
```

### **Smoke Test Checklist**

#### **Test 1.1: Basic Navigation (2 min)**
- [ ] Navigate to http://localhost:8080
- [ ] Login as Administrator
- [ ] Navigate to Operations page (`/ops`)
- [ ] Verify page loads without errors
- [ ] Check browser console (should be clean)

**Expected:** ✅ Page loads, no errors

---

#### **Test 1.2: Room Detail Panel (3 min)**
- [ ] Click on any room card
- [ ] Verify detail panel slides in from right
- [ ] Verify room information displays
- [ ] Verify tabs are present (Info, Occupants, Issues, Keys, History)
- [ ] Click close button
- [ ] Verify panel closes

**Expected:** ✅ Panel works, all tabs visible

---

#### **Test 1.3: Basic Status Update (5 min)**
- [ ] Open a room detail panel
- [ ] Click "Update Status" button
- [ ] Verify modal opens
- [ ] Select a different status from dropdown
- [ ] Enter notes: "Test status update"
- [ ] Click "Update Status"
- [ ] Verify success toast appears
- [ ] Verify status badge updates
- [ ] Verify modal closes

**Expected:** ✅ Status update works end-to-end

---

#### **Test 1.4: Audit Trail (3 min)**
- [ ] In same room panel, click "History" tab
- [ ] Verify audit entry appears
- [ ] Verify entry shows:
  - Your email/name
  - Timestamp (recent)
  - Status change (old → new)
  - Notes: "Test status update"

**Expected:** ✅ Audit trail records change

---

#### **Test 1.5: Permission Check (2 min)**
- [ ] Logout
- [ ] Login as Staff (no update permission)
- [ ] Navigate to Operations page
- [ ] Click on a room
- [ ] Verify "Update Status" button is disabled or hidden

**Expected:** ✅ Permissions enforced

---

### **Smoke Test Results**

**Status:** [ ] PASS / [ ] FAIL

**Issues Found:**
- [ ] None - Proceed to Phase 2
- [ ] Critical issues - STOP and fix
- [ ] Minor issues - Document and continue

---

## 🧪 Phase 2: Core Functionality (45 min)

### **2.1: Happy Path Testing (15 min)**

#### **Scenario 1: Administrator Status Update**

**Reference:** ops-v1-checklist.md, lines 45-79

**Steps:**
1. [ ] Login as Administrator
2. [ ] Navigate to `/ops`
3. [ ] Click on Room 101 (or any room)
4. [ ] Verify current status displays
5. [ ] Click "Update Status"
6. [ ] Select "Maintenance"
7. [ ] Enter notes: "Scheduled HVAC maintenance"
8. [ ] Click "Update Status"
9. [ ] Verify success toast: "Status updated successfully"
10. [ ] Verify status badge shows "Maintenance"
11. [ ] Switch to "History" tab
12. [ ] Verify audit entry with all details

**Performance Check:**
- [ ] Status update completed in < 500ms
- [ ] Optimistic update appeared immediately
- [ ] No console errors

**Result:** [ ] PASS / [ ] FAIL

**Notes:**
```
Time taken: ___ms
Issues: ___
```

---

#### **Scenario 2: Facilities Staff Status Update**

**Reference:** ops-v1-checklist.md, lines 82-103

**Steps:**
1. [ ] Logout
2. [ ] Login as Facilities Staff
3. [ ] Navigate to `/ops`
4. [ ] Click on a different room
5. [ ] Click "Update Status"
6. [ ] Select new status
7. [ ] Enter notes
8. [ ] Click "Update Status"
9. [ ] Verify success toast
10. [ ] Verify audit trail shows Facilities Staff as user

**Result:** [ ] PASS / [ ] FAIL

---

### **2.2: RBAC Testing (20 min)**

**Reference:** ops-v1-checklist.md, lines 311-364

#### **Test 2.2.1: Administrator Permissions**
- [ ] Login as Administrator
- [ ] Verify can view all rooms
- [ ] Verify can update status
- [ ] Verify Edit button visible
- [ ] Verify Delete button visible
- [ ] Verify can view audit trail
- [ ] No permission errors

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 2.2.2: Manager Permissions**
- [ ] Login as Manager
- [ ] Verify can view all rooms
- [ ] Verify can update status
- [ ] Verify Edit button visible
- [ ] Verify Delete button hidden/disabled
- [ ] Verify can view audit trail
- [ ] Try to delete (should fail)

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 2.2.3: Facilities Staff Permissions**
- [ ] Login as Facilities Staff
- [ ] Verify can view all rooms
- [ ] Verify can update status
- [ ] Verify Edit button hidden/disabled
- [ ] Verify Delete button hidden
- [ ] Verify can view audit trail

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 2.2.4: Staff Permissions**
- [ ] Login as Staff
- [ ] Verify can view all rooms
- [ ] Verify Update Status button hidden/disabled
- [ ] Verify Edit button hidden
- [ ] Verify Delete button hidden
- [ ] Verify History tab hidden or shows error

**Result:** [ ] PASS / [ ] FAIL

---

### **2.3: Edge Cases (10 min)**

#### **Test 2.3.1: Network Error**

**Reference:** ops-v1-checklist.md, lines 156-180

**Steps:**
1. [ ] Login as Administrator
2. [ ] Open DevTools → Network tab
3. [ ] Set network to "Offline"
4. [ ] Try to update room status
5. [ ] Verify error toast appears
6. [ ] Verify optimistic update rolls back
7. [ ] Set network to "Online"
8. [ ] Retry update
9. [ ] Verify success

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 2.3.2: Room Not Found**

**Reference:** ops-v1-checklist.md, lines 134-153

**Steps:**
1. [ ] Navigate to `/facilities/invalid-id-12345`
2. [ ] Verify empty state shows
3. [ ] Verify message: "Room not found"
4. [ ] Verify "Back to Facilities" button works
5. [ ] No console errors

**Result:** [ ] PASS / [ ] FAIL

---

## ⚡ Phase 3: Advanced Testing (60 min)

### **3.1: Performance Testing (20 min)**

**Reference:** ops-v1-checklist.md, lines 367-401

#### **Test 3.1.1: Panel Load Time**

**Steps:**
1. [ ] Open DevTools → Performance tab
2. [ ] Start recording
3. [ ] Click on a room card
4. [ ] Stop recording when panel fully loaded
5. [ ] Measure time from click to display

**Benchmarks:**
- [ ] Target: < 300ms
- [ ] Acceptable: < 500ms
- [ ] Actual: ___ms

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 3.1.2: Status Update Time**

**Steps:**
1. [ ] Open DevTools → Network tab
2. [ ] Click "Update Status"
3. [ ] Select new status
4. [ ] Click "Update Status"
5. [ ] Measure time from click to success toast

**Benchmarks:**
- [ ] Target: < 500ms
- [ ] Acceptable: < 1s
- [ ] Actual: ___ms

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 3.1.3: Audit Trail Load Time**

**Steps:**
1. [ ] Open room with many status changes (20+)
2. [ ] Click "History" tab
3. [ ] Measure time to display entries

**Benchmarks:**
- [ ] Target: < 400ms
- [ ] Acceptable: < 600ms
- [ ] Actual: ___ms
- [ ] Pagination works: [ ] YES / [ ] NO

**Result:** [ ] PASS / [ ] FAIL

---

### **3.2: Integration Testing (20 min)**

**Reference:** ops-v1-checklist.md, lines 404-435

#### **Test 3.2.1: End-to-End Flow**

**Steps:**
1. [ ] Login → Navigate → View Room → Update Status → Verify Audit → Logout
2. [ ] Complete flow without errors
3. [ ] All data persists correctly
4. [ ] Session maintained throughout
5. [ ] Clean logout

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 3.2.2: Cross-Module Integration**

**Steps:**
1. [ ] Update room status in Operations page
2. [ ] Navigate to Facilities page
3. [ ] Verify status updated there
4. [ ] Navigate to Dashboard
5. [ ] Verify stats reflect change (if applicable)

**Result:** [ ] PASS / [ ] FAIL

---

### **3.3: Security Testing (20 min)**

**Reference:** ops-v1-checklist.md, lines 526-557

#### **Test 3.3.1: XSS Protection**

**Steps:**
1. [ ] Try to enter `<script>alert('XSS')</script>` in notes field
2. [ ] Submit status update
3. [ ] View audit trail
4. [ ] Verify script is escaped (displayed as text, not executed)
5. [ ] No alert popup

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 3.3.2: Permission Bypass Attempt**

**Steps:**
1. [ ] Login as Staff (no update permission)
2. [ ] Open DevTools → Console
3. [ ] Try to call update API directly:
   ```javascript
   fetch('/api/rooms/123/status', {
     method: 'PUT',
     body: JSON.stringify({ status: 'maintenance' })
   })
   ```
4. [ ] Verify request rejected
5. [ ] Verify error: "Permission denied"

**Result:** [ ] PASS / [ ] FAIL

---

## 🎨 Phase 4: Polish & Validation (30 min)

### **4.1: Responsive Design (15 min)**

**Reference:** ops-v1-checklist.md, lines 472-496

#### **Test 4.1.1: Desktop (1920x1080)**
- [ ] Resize browser to 1920x1080
- [ ] Panel slides in from right (400px width)
- [ ] All content visible
- [ ] No horizontal scroll
- [ ] Buttons accessible

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 4.1.2: Tablet (768x1024)**
- [ ] Resize browser to 768x1024
- [ ] Panel width adjusts appropriately
- [ ] Content readable
- [ ] Touch targets adequate (44px min)
- [ ] Scrolling smooth

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 4.1.3: Mobile (375x667)**
- [ ] Resize browser to 375x667
- [ ] Panel goes full screen
- [ ] Close button visible
- [ ] Form inputs accessible
- [ ] All content fits

**Result:** [ ] PASS / [ ] FAIL

---

### **4.2: Accessibility (15 min)**

**Reference:** ops-v1-checklist.md, lines 499-523

#### **Test 4.2.1: Keyboard Navigation**
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modal/panel
- [ ] Focus visible on all elements
- [ ] No keyboard traps

**Result:** [ ] PASS / [ ] FAIL

---

#### **Test 4.2.2: Screen Reader (Optional)**
- [ ] Enable screen reader (VoiceOver/NVDA)
- [ ] Panel announces when opened
- [ ] Status change announced
- [ ] Error messages read aloud
- [ ] Form labels associated

**Result:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

---

#### **Test 4.2.3: Color Contrast**
- [ ] Run axe DevTools
- [ ] Verify no contrast issues
- [ ] Status badges readable
- [ ] Error messages visible
- [ ] Focus indicators clear

**Result:** [ ] PASS / [ ] FAIL

---

## 📊 Test Results Summary

### **Overall Statistics**

| Phase | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-------|-------------|--------|--------|---------|-----------|
| **Phase 1: Smoke Test** | 5 | | | | |
| **Phase 2: Core** | 7 | | | | |
| **Phase 3: Advanced** | 7 | | | | |
| **Phase 4: Polish** | 6 | | | | |
| **TOTAL** | **25** | | | | **___%** |

---

### **Critical Issues Found**

**Priority: 🔴 CRITICAL**
1. _[Issue description]_
2. _[Issue description]_

**Priority: 🟡 HIGH**
1. _[Issue description]_
2. _[Issue description]_

**Priority: 🟢 MEDIUM**
1. _[Issue description]_

**Priority: ⚪ LOW**
1. _[Issue description]_

---

### **Performance Metrics**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Panel Load | < 300ms | ___ms | [ ] PASS / [ ] FAIL |
| Status Update | < 500ms | ___ms | [ ] PASS / [ ] FAIL |
| Audit Trail | < 400ms | ___ms | [ ] PASS / [ ] FAIL |

---

### **Browser Compatibility**

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | ___ | [ ] PASS / [ ] FAIL | |
| Firefox | ___ | [ ] PASS / [ ] FAIL | |
| Safari | ___ | [ ] PASS / [ ] FAIL | |
| Edge | ___ | [ ] PASS / [ ] FAIL | |

---

## ✅ Sign-Off Checklist

### **Production Readiness**

- [ ] All smoke tests passed
- [ ] All happy path scenarios work
- [ ] RBAC enforced correctly
- [ ] Performance targets met
- [ ] Edge cases handled
- [ ] Security validated
- [ ] Responsive design works
- [ ] Accessibility compliant
- [ ] No critical bugs
- [ ] < 3 non-critical bugs
- [ ] Documentation updated

### **Approvals**

**QA Lead:** _______________ Date: ___________  
**Product Owner:** _______________ Date: ___________  
**Tech Lead:** _______________ Date: ___________

---

## 📝 Notes & Observations

### **Positive Findings**
- _[What worked well]_
- _[Impressive features]_
- _[Performance highlights]_

### **Areas for Improvement**
- _[UX suggestions]_
- _[Performance optimizations]_
- _[Feature requests]_

### **Technical Debt**
- _[Code improvements needed]_
- _[Test coverage gaps]_
- _[Refactoring opportunities]_

---

## 🚀 Next Steps

### **If All Tests Pass:**
1. [ ] Update Epic 003 status to 100%
2. [ ] Mark all stories as complete
3. [ ] Prepare deployment checklist
4. [ ] Schedule production deployment
5. [ ] Plan post-deployment monitoring

### **If Tests Fail:**
1. [ ] Log all issues in tracker
2. [ ] Prioritize critical fixes
3. [ ] Assign to developers
4. [ ] Re-test after fixes
5. [ ] Update documentation

---

## 📞 Support & Resources

**Documentation:**
- Full Checklist: `docs/qa/ops-v1-checklist.md`
- Epic 003: `docs/epics/epic-003-ops-module-v1.md`
- Stories: `docs/stories/story-009-*.md` through `story-013-*.md`

**Test Environment:**
- URL: http://localhost:8080
- Test Users: See test account credentials
- Test Data: Seeded in development database

**Tools:**
- Browser DevTools (Network, Console, Performance)
- React Query DevTools
- axe DevTools (Accessibility)
- Lighthouse (Performance)

---

**Test Execution Started:** _____________  
**Test Execution Completed:** _____________  
**Total Duration:** _____________  
**Final Status:** [ ] APPROVED / [ ] REJECTED / [ ] CONDITIONAL

---

**Ready to begin testing! Start with Phase 1 (Smoke Test) and work through systematically.** 🚀
