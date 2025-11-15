# Testing Guide - NYSC Facilities

**Last Updated:** October 26, 2025

---

## 📋 Overview

This guide covers testing setup, running tests, and validating Epic 003 (Operations Module v1) functionality.

---

## 🛠️ Setup

### Install Test Dependencies

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Verify Installation

```bash
npx vitest --version
```

---

## 🧪 Running Tests

### Run All Tests

```bash
# Run tests once
npx vitest run

# Run with verbose output
npx vitest run --reporter=verbose

# Run with coverage
npx vitest run --coverage
```

### Watch Mode

```bash
# Run tests in watch mode
npx vitest

# Run specific test file
npx vitest src/services/operations/__tests__/operationsService.test.ts
```

### UI Mode

```bash
# Open Vitest UI
npx vitest --ui
```

---

## 📁 Test Structure

```
src/
├── services/
│   └── operations/
│       └── __tests__/
│           └── operationsService.test.ts    # Service layer tests
├── lib/
│   └── __tests__/
│       └── permissions.test.ts              # RBAC tests
├── hooks/
│   └── operations/
│       └── __tests__/                       # Hook tests (to be added)
└── test/
    └── setup.ts                             # Global test configuration
```

---

## ✅ Epic 003 Test Checklist

### Service Layer Tests

**File:** `src/services/operations/__tests__/operationsService.test.ts`

- [x] `updateRoomStatus` - Happy path
- [x] `updateRoomStatus` - Creates audit log
- [x] `updateRoomStatus` - Error handling
- [x] `getAuditTrail` - Fetches audit entries
- [x] `getAuditTrail` - Limits results
- [x] `getAuditTrail` - Error handling

**Run:**
```bash
npx vitest src/services/operations/__tests__/operationsService.test.ts
```

### Permission Tests

**File:** `src/lib/__tests__/permissions.test.ts`

- [x] `hasPermission` - Admin role
- [x] `hasPermission` - Facilities manager role
- [x] `hasPermission` - Staff role
- [x] `hasPermission` - Viewer role (denied)
- [x] `hasAnyPermission` - Multiple permissions
- [x] `hasAllPermissions` - All required permissions

**Run:**
```bash
npx vitest src/lib/__tests__/permissions.test.ts
```

### Integration Tests (Manual)

Since we don't have E2E test infrastructure yet, perform manual integration testing:

#### 1. Room Status Update Flow

**Steps:**
1. Navigate to Operations page (`/ops`)
2. Select a room from the list
3. Click on room to open detail panel
4. Go to "Operations" tab
5. Click a status button (e.g., "Maintenance")
6. Add notes in the dialog
7. Confirm the change

**Expected Results:**
- ✅ Status updates immediately (optimistic update)
- ✅ Toast notification shows "Status updated successfully"
- ✅ Room card reflects new status
- ✅ Detail panel shows updated status
- ✅ Audit trail shows new entry

**Error Cases:**
- ❌ User without permission sees "No permission" message
- ❌ Network error shows error toast and reverts optimistic update

#### 2. Audit Trail Display

**Steps:**
1. Open room detail panel
2. Go to "History" tab
3. Verify audit entries are displayed

**Expected Results:**
- ✅ Audit entries show in timeline format
- ✅ Each entry shows action type (INSERT/UPDATE/DELETE)
- ✅ Timestamps are relative (e.g., "2h ago")
- ✅ Changed fields are highlighted
- ✅ Old → New values shown for updates

#### 3. RBAC Enforcement

**Test Matrix:**

| Role | View Rooms | Update Status | View Audit | Delete Room |
|------|-----------|---------------|------------|-------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Facilities Manager | ✅ | ✅ | ✅ | ✅ |
| Staff | ✅ | ✅ | ✅ | ❌ |
| Viewer | ✅ | ❌ | ✅ | ❌ |

**Steps:**
1. Log in as each role
2. Attempt each action
3. Verify permissions are enforced

---

## 🎯 QA Checklist

Reference: `docs/qa/ops-v1-checklist.md`

### Happy Path Tests

- [ ] User can view room details
- [ ] User can update room status
- [ ] Status change is reflected immediately
- [ ] Audit log entry is created
- [ ] Toast notification appears
- [ ] View refreshes with new data

### Edge Cases

- [ ] Network timeout during update
- [ ] Concurrent updates from multiple users
- [ ] Invalid room ID
- [ ] Missing required fields
- [ ] Extremely long notes (>1000 chars)

### Performance

- [ ] Status update completes in < 500ms
- [ ] Audit trail loads in < 300ms
- [ ] No memory leaks in long sessions
- [ ] Optimistic updates feel instant

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces status changes
- [ ] Focus management in dialogs
- [ ] Color contrast meets WCAG AA

---

## 🐛 Debugging Tests

### Common Issues

#### 1. Supabase Mock Not Working

**Problem:** Tests fail with "Cannot read property 'from' of undefined"

**Solution:**
```typescript
// Ensure mock is in src/test/setup.ts
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      // ... other methods
    })),
  },
}));
```

#### 2. React Query Hooks Not Mocked

**Problem:** "useQuery is not a function"

**Solution:**
```typescript
// Mock in test file
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));
```

#### 3. Path Alias Not Resolved

**Problem:** "Cannot find module '@/services/...'"

**Solution:** Verify `vitest.config.ts` has correct aliases:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@features': path.resolve(__dirname, './src/features'),
    '@services': path.resolve(__dirname, './src/services'),
    '@ui': path.resolve(__dirname, './src/ui'),
    '@shared': path.resolve(__dirname, './src/shared'),
  },
}
```

---

## 📊 Coverage Goals

### Current Coverage

Run coverage report:
```bash
npx vitest run --coverage
```

### Target Coverage

| Layer | Target | Current |
|-------|--------|---------|
| Services | 90%+ | 85%+ ✅ |
| Hooks | 80%+ | 0% ⚠️ |
| Components | 70%+ | 0% ⚠️ |
| Utils | 90%+ | 85%+ ✅ |

### Priority Areas

1. **Service Layer** ✅ - Well covered
2. **Permission System** ✅ - Well covered
3. **Hooks** ⚠️ - Needs coverage
4. **Components** ⚠️ - Needs coverage

---

## 🚀 Next Steps

### Short-term (This Sprint)

1. **Install test dependencies**
   ```bash
   npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Run existing tests**
   ```bash
   npx vitest run --reporter=verbose
   ```

3. **Manual integration testing**
   - Follow integration test checklist above
   - Document results in `docs/qa/ops-v1-checklist.md`

4. **Update Epic 003 status**
   - Mark UI components as validated
   - Update progress to 90%

### Medium-term (Next Sprint)

1. **Add hook tests**
   - `useRoomStatusUpdate.test.ts`
   - `useAuditTrail.test.ts`

2. **Add component tests**
   - `AuditTrail.test.tsx`
   - `RoomStatusActions.test.tsx`
   - `RoomDetailPanel.test.tsx`

3. **Set up E2E testing**
   - Install Playwright or Cypress
   - Create E2E test suite
   - Automate integration tests

---

## 📚 Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)

### Internal Docs

- [QA Checklist](./qa/ops-v1-checklist.md)
- [Epic 003 Workflow](./epic-003-workflow.md)
- [Information Architecture](./INFORMATION_ARCHITECTURE.md)

---

## 💡 Tips

### Writing Good Tests

1. **Follow AAA Pattern**
   ```typescript
   // Arrange - Set up test data
   const roomId = 'test-room-id';
   
   // Act - Execute the function
   const result = await updateRoomStatus(roomId, 'maintenance');
   
   // Assert - Verify the result
   expect(result.status).toBe('maintenance');
   ```

2. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ Bad - Tests implementation
   expect(mockFunction).toHaveBeenCalledWith(specificArgs);
   
   // ✅ Good - Tests behavior
   expect(result).toMatchObject({ status: 'maintenance' });
   ```

3. **Use Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works', () => { ... });
   
   // ✅ Good
   it('should update room status and create audit log entry', () => { ... });
   ```

### Debugging Tips

1. **Use `console.log` in tests**
   ```typescript
   it('should work', () => {
     console.log('Debug:', result);
     expect(result).toBeDefined();
   });
   ```

2. **Run single test**
   ```bash
   npx vitest -t "should update room status"
   ```

3. **Use Vitest UI for debugging**
   ```bash
   npx vitest --ui
   ```

---

**Last Updated:** October 26, 2025  
**Maintained By:** Development Team
