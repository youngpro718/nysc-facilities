# Quick Start Testing Guide

**Time Required:** 5-10 minutes  
**Purpose:** Rapid verification that everything works  
**Environment:** http://localhost:8080

---

## 🚀 Quick Start (5 minutes)

### **Step 1: Open Application (30 seconds)**

```bash
# Server should already be running
# Open browser to:
http://localhost:8080
```

---

### **Step 2: Test Dashboard (1 minute)**

1. **Navigate to Dashboard** (`/`)
   - [ ] Stats cards show numbers
   - [ ] Building overview displays
   - [ ] No console errors

**Quick Check:** Do you see real data? ✅ / ❌

---

### **Step 3: Test Facilities Page (2 minutes)**

1. **Navigate to Facilities** (`/facilities`)
   - [ ] Room list displays
   - [ ] Search box works (type "101")
   - [ ] Building filter has options
   - [ ] Status filter has options
   - [ ] Grid/List toggle works

2. **Click on a room card**
   - [ ] Detail page loads
   - [ ] Room information shows
   - [ ] Tabs work (Info, Occupants, etc.)
   - [ ] Back button works

**Quick Check:** Can you navigate and filter? ✅ / ❌

---

### **Step 4: Test Operations Page (2 minutes)**

1. **Navigate to Operations** (`/ops`)
   - [ ] Stats summary shows (Available, Occupied, etc.)
   - [ ] Room cards display (compact view)
   - [ ] Search works
   - [ ] Filters work
   - [ ] Tabs switch (All Rooms, Maintenance, etc.)

2. **Click on a room card**
   - [ ] Navigates to detail page
   - [ ] All information displays

**Quick Check:** Does operations hub work? ✅ / ❌

---

### **Step 5: Test Responsive Design (30 seconds)**

1. **Resize browser window**
   - [ ] Mobile view (narrow) - Content stacks
   - [ ] Desktop view (wide) - Grid layout
   - [ ] No horizontal scroll
   - [ ] Everything readable

**Quick Check:** Is it responsive? ✅ / ❌

---

## ✅ Quick Test Results

**Overall Status:** [ ] ALL PASS / [ ] SOME ISSUES

**If ALL PASS:**
- ✅ System is working!
- ✅ Ready for detailed testing
- ✅ Proceed to full test plan

**If SOME ISSUES:**
- ⚠️ Document what failed
- ⚠️ Check browser console
- ⚠️ Report to development team

---

## 🐛 Common Issues & Fixes

### **Issue: Page won't load**
**Fix:** Check if dev server is running
```bash
npm run dev
```

### **Issue: No data showing**
**Fix:** Check database connection
- Verify Supabase credentials
- Check network tab for API errors

### **Issue: Console errors**
**Fix:** Check for:
- Missing environment variables
- TypeScript errors
- Network failures

---

## 📊 Quick Checklist Summary

| Page | Load | Data | Filters | Navigation | Status |
|------|:----:|:----:|:-------:|:----------:|:------:|
| Dashboard | [ ] | [ ] | N/A | [ ] | |
| Facilities | [ ] | [ ] | [ ] | [ ] | |
| Facility Detail | [ ] | [ ] | N/A | [ ] | |
| Operations | [ ] | [ ] | [ ] | [ ] | |

**Pass Rate:** ___/16 (___%)

---

## 🎯 Next Steps

**If Quick Test Passes:**
→ Proceed to `TEST_EXECUTION_PLAN.md` for comprehensive testing

**If Quick Test Fails:**
→ Fix critical issues first, then retry

---

**Quick test complete! Ready for full testing?** 🚀
