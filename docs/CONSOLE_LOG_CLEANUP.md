# Console Log Cleanup Guide

**Date:** October 26, 2025  
**Issue:** 557 console.log statements across 140 files  
**Priority:** Medium (before production)  
**Estimated Time:** 2-3 hours

---

## 🎯 Objective

Replace all console.log statements with the production-safe logger utility to prevent:
- Console clutter in production
- Potential performance issues
- Exposure of sensitive data
- Unprofessional appearance

---

## 🔧 Solution: Use Existing Logger

We already have a production-safe logger at `src/lib/logger.ts`

### **Logger Features:**
- Environment-aware (only logs in development)
- Multiple log levels (debug, info, warn, error)
- Formatted timestamps
- Context support
- Can be silenced in production

---

## 📝 Replacement Patterns

### **Pattern 1: Simple Debug Logs**
```typescript
// BEFORE
console.log('User data:', userData);

// AFTER
import { logger } from '@/lib/logger';
logger.debug('User data', userData);
```

### **Pattern 2: Info Logs**
```typescript
// BEFORE
console.log('Fetching rooms...');

// AFTER
import { logger } from '@/lib/logger';
logger.info('Fetching rooms');
```

### **Pattern 3: Error Logs**
```typescript
// BEFORE
console.error('Failed to load:', error);

// AFTER
import { logger } from '@/lib/logger';
logger.error('Failed to load', error);
```

### **Pattern 4: Warning Logs**
```typescript
// BEFORE
console.warn('Deprecated function used');

// AFTER
import { logger } from '@/lib/logger';
logger.warn('Deprecated function used');
```

---

## 📊 Top Files to Clean (Priority Order)

Based on audit findings, these files have the most console.logs:

### **High Priority (15+ logs each):**
1. `src/hooks/useAdminRealtimeNotifications.ts` - 20 logs
2. `src/components/issues/hooks/queries/useIssueList.ts` - 19 logs
3. `src/components/occupants/services/occupantService.ts` - 18 logs
4. `src/utils/pdfParser.ts` - 18 logs
5. `src/components/court/PdfUploadArea.tsx` - 17 logs
6. `src/components/spaces/EditSpaceDialog.tsx` - 17 logs
7. `src/components/spaces/CreateSpaceDialog.tsx` - 16 logs

### **Medium Priority (10-14 logs each):**
8. `src/components/spaces/services/unifiedSpaceService.ts` - 14 logs
9. `src/hooks/useNotifications.ts` - 11 logs
10. `src/hooks/useRealtimeNotifications.ts` - 11 logs

---

## 🚀 Quick Cleanup Commands

### **Find all console.log statements:**
```bash
grep -r "console.log" src --include="*.ts" --include="*.tsx" | wc -l
```

### **Find files with most console.logs:**
```bash
grep -r "console.log" src --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

### **Find console.logs in a specific file:**
```bash
grep -n "console.log" src/hooks/useAdminRealtimeNotifications.ts
```

---

## 🔄 Automated Replacement (Use with Caution)

### **Step 1: Add logger import to file**
```bash
# Add import at top of file if not present
# import { logger } from '@/lib/logger';
```

### **Step 2: Replace patterns**
```bash
# Replace console.log with logger.debug
sed -i '' 's/console\.log(/logger.debug(/g' filename.ts

# Replace console.error with logger.error
sed -i '' 's/console\.error(/logger.error(/g' filename.ts

# Replace console.warn with logger.warn
sed -i '' 's/console\.warn(/logger.warn(/g' filename.ts

# Replace console.info with logger.info
sed -i '' 's/console\.info(/logger.info(/g' filename.ts
```

**⚠️ Warning:** Review changes carefully! Some console.logs may be intentional for debugging.

---

## 📋 Manual Cleanup Checklist

### **Phase 1: Critical Files (1 hour)**
- [ ] useAdminRealtimeNotifications.ts (20 logs)
- [ ] useIssueList.ts (19 logs)
- [ ] occupantService.ts (18 logs)
- [ ] pdfParser.ts (18 logs)
- [ ] PdfUploadArea.tsx (17 logs)

### **Phase 2: High-Traffic Files (1 hour)**
- [ ] EditSpaceDialog.tsx (17 logs)
- [ ] CreateSpaceDialog.tsx (16 logs)
- [ ] unifiedSpaceService.ts (14 logs)
- [ ] useNotifications.ts (11 logs)
- [ ] useRealtimeNotifications.ts (11 logs)

### **Phase 3: Remaining Files (1 hour)**
- [ ] All other files with 5+ console.logs
- [ ] Spot check files with 1-4 console.logs

---

## ✅ Verification

### **After cleanup, verify:**
```bash
# Should return 0 or very few
grep -r "console.log" src --include="*.ts" --include="*.tsx" | wc -l

# Check that logger is being used
grep -r "logger\." src --include="*.ts" --include="*.tsx" | wc -l
```

### **Test in browser:**
1. Open browser console
2. Navigate through app
3. Verify minimal console output
4. Check that errors still appear

---

## 🎯 Production Configuration

### **Set log level in production:**

Create `.env.production`:
```bash
VITE_LOG_LEVEL=error
```

This will:
- ✅ Only show errors in production
- ✅ Hide all debug/info/warn logs
- ✅ Keep console clean for users
- ✅ Still log critical errors

---

## 📊 Progress Tracking

**Current Status:**
- Total console.logs: 557
- Files affected: 140
- Cleaned: 0
- Remaining: 557

**Update this as you progress!**

---

## 🔍 Special Cases

### **Keep These Console Logs:**
Some console.logs should remain (but use logger instead):
- Critical error logging
- Security event logging
- Performance monitoring
- Development-only debugging

### **Remove These Console Logs:**
- Data dumps
- "Entering function" logs
- Variable value logs
- Success messages
- Redundant logs

---

## 💡 Best Practices

### **DO:**
- ✅ Use logger.debug() for development debugging
- ✅ Use logger.info() for important events
- ✅ Use logger.warn() for warnings
- ✅ Use logger.error() for errors
- ✅ Include context objects
- ✅ Use descriptive messages

### **DON'T:**
- ❌ Log sensitive data (passwords, tokens)
- ❌ Log in tight loops
- ❌ Log large objects without context
- ❌ Use console.log directly
- ❌ Leave debug logs in production code

---

## 🚀 Quick Start

**To clean up a single file:**

1. Open the file
2. Add logger import:
   ```typescript
   import { logger } from '@/lib/logger';
   ```
3. Replace console.log with logger.debug
4. Replace console.error with logger.error
5. Replace console.warn with logger.warn
6. Test the file
7. Commit changes

**Example commit message:**
```
chore: replace console.log with logger in useAdminRealtimeNotifications

- Replace 20 console.log statements with logger.debug
- Add logger import
- Improve log message clarity
```

---

## 📈 Expected Results

**Before:**
- 557 console.log statements
- Cluttered browser console
- Potential performance issues
- Unprofessional appearance

**After:**
- 0 console.log statements
- Clean browser console
- Better performance
- Production-ready logging
- Environment-aware logging

---

**Status:** Ready to begin cleanup  
**Priority:** Medium (before production)  
**Estimated Completion:** 2-3 hours
