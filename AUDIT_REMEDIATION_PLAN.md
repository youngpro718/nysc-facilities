# NYSC Facilities - Audit Remediation Plan

**Created:** March 20, 2026  
**Scope:** Address all critical and medium findings from audit (excluding email verification and MFA)  
**Estimated Total Effort:** 10-12 days

---

## Overview

This plan addresses 17 findings from the critical audit, organized into 12 phases. Each phase is designed to be completed independently with clear acceptance criteria.

**Priority Legend:**
- 🔴 **P0:** Production blockers (deferred: email verification, MFA)
- 🟠 **P1:** High priority - security vulnerabilities and broken workflows
- 🟡 **P2:** Medium priority - technical debt and UX improvements

---

## Phase 1: Remove Supply Room Department Permission Backdoor
**Priority:** 🟠 P1  
**Finding:** HIGH-3  
**Estimated Effort:** 4 hours

### Problem
`useRolePermissions.ts` has a fallback that grants admin permissions to anyone with `department_name === 'Supply Room'`, bypassing the role-based permission system.

### Tasks
1. **Remove department-based fallback** in `useRolePermissions.ts:309-318`
2. **Create dedicated role:** Add `supply_room_staff` to role system if needed
3. **Migrate existing users:** Identify users relying on department fallback and assign proper roles
4. **Update role permissions map:** Add `supply_room_staff` with appropriate permissions

### Files to Modify
- `src/features/auth/hooks/useRolePermissions.ts`
- `src/config/roles.ts`
- `db/migrations/050_add_supply_room_staff_role.sql` (new)

### Acceptance Criteria
- [ ] Department-based permission fallback removed
- [ ] All users have explicit role assignments
- [ ] TypeScript compilation passes
- [ ] No permission regressions for supply room staff

### Testing
```bash
# Test that users without roles get null permissions (not department-based)
# Test that supply_room_staff role has correct permissions
# Test that existing supply workflows still work
```

---

## Phase 2: Audit and Fix RLS Policies for All 8 Roles
**Priority:** 🟠 P1  
**Finding:** HIGH-4  
**Estimated Effort:** 2 days

### Problem
Database RLS helper functions only recognize subset of 8 frontend roles, creating permission mismatches.

### Tasks
1. **Create missing helper functions:**
   - `is_court_aide()`
   - `is_court_officer()`
   - `is_purchasing()`
   - `is_cmc()` (if not exists)
   - `is_facilities_manager()` (if not exists)

2. **Audit all RLS policies:**
   - Review every table's policies
   - Ensure all 8 roles are handled
   - Document which roles can read/write each table

3. **Update policies to use role-specific helpers**

### Files to Create/Modify
- `db/migrations/051_add_role_helper_functions.sql` (new)
- `db/migrations/052_audit_rls_policies.sql` (new)
- `docs/RLS_POLICY_MATRIX.md` (new - documentation)

### Acceptance Criteria
- [ ] All 8 roles have corresponding helper functions
- [ ] Every table with RLS has policies for all applicable roles
- [ ] Documentation matrix shows role × table permissions
- [ ] No frontend/backend permission mismatches

### Testing
```sql
-- Test each helper function
SELECT is_court_aide(); -- for court_aide user
SELECT is_purchasing(); -- for purchasing user
-- etc.

-- Test policies for each role
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "<user_id>", "role": "authenticated"}';
-- Attempt reads/writes as each role
```

---

## Phase 3: Add Missing RLS Policies on Lighting Tables
**Priority:** 🟠 P1  
**Finding:** HIGH-11  
**Estimated Effort:** 4 hours

### Problem
Lighting tables (`lighting_fixtures`, `walkthrough_sessions`, `fixture_scans`, `lighting_zones`) may lack RLS policies.

### Tasks
1. **Verify current RLS status:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'lighting%';
   ```

2. **Enable RLS and create policies:**
   - `lighting_fixtures`: Read (all authenticated), Write (admin, facilities_manager, court_officer)
   - `walkthrough_sessions`: Read (all authenticated), Write (admin, facilities_manager, court_officer)
   - `fixture_scans`: Read (all authenticated), Write (admin, facilities_manager, court_officer)
   - `lighting_zones`: Read (all authenticated), Write (admin, facilities_manager)

3. **Add building isolation:** Filter by `building_id` where applicable

### Files to Create
- `db/migrations/053_lighting_rls_policies.sql`

### Acceptance Criteria
- [ ] All lighting tables have RLS enabled
- [ ] Policies match role permission matrix
- [ ] Court officers can manage fixtures
- [ ] Standard users cannot modify lighting data
- [ ] Building isolation works correctly

### Testing
```sql
-- As court_officer: should be able to create/update fixtures
-- As standard user: should be able to read but not write
-- As admin: should have full access
```

---

## Phase 4: Implement Database-Level Status Transition Validation
**Priority:** 🟡 P2  
**Finding:** MEDIUM-5  
**Estimated Effort:** 6 hours

### Problem
Supply request status transitions are only validated in TypeScript, allowing invalid state changes via direct database access.

### Tasks
1. **Create status transition table:**
   ```sql
   CREATE TABLE supply_status_transitions (
     from_status order_status NOT NULL,
     to_status order_status NOT NULL,
     PRIMARY KEY (from_status, to_status)
   );
   ```

2. **Populate valid transitions:**
   ```sql
   INSERT INTO supply_status_transitions VALUES
     ('submitted', 'received'),
     ('submitted', 'cancelled'),
     ('submitted', 'rejected'),
     ('pending_approval', 'approved'),
     ('pending_approval', 'rejected'),
     -- etc.
   ```

3. **Create validation trigger:**
   ```sql
   CREATE FUNCTION validate_supply_status_transition()
   RETURNS TRIGGER AS $$
   BEGIN
     IF OLD.status IS NOT NULL AND NEW.status != OLD.status THEN
       IF NOT EXISTS (
         SELECT 1 FROM supply_status_transitions
         WHERE from_status = OLD.status AND to_status = NEW.status
       ) THEN
         RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
       END IF;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Apply to supply_requests table**

### Files to Create
- `db/migrations/054_supply_status_validation.sql`

### Acceptance Criteria
- [ ] Invalid transitions are rejected at database level
- [ ] Error messages are clear
- [ ] Frontend still works (valid transitions succeed)
- [ ] Cannot bypass validation via direct SQL

### Testing
```sql
-- Should succeed
UPDATE supply_requests SET status = 'received' WHERE id = '...' AND status = 'submitted';

-- Should fail
UPDATE supply_requests SET status = 'completed' WHERE id = '...' AND status = 'pending_approval';
```

---

## Phase 5: Consolidate User Approval Fields
**Priority:** 🟡 P2  
**Finding:** MEDIUM-6  
**Estimated Effort:** 1 day

### Problem
User approval uses two fields (`verification_status` enum and `is_approved` boolean) that can get out of sync.

### Tasks
1. **Choose single source of truth:** Use `verification_status` enum (more expressive)

2. **Create migration to consolidate:**
   ```sql
   -- Set verification_status based on is_approved for any inconsistent records
   UPDATE profiles 
   SET verification_status = CASE
     WHEN is_approved = true THEN 'verified'
     WHEN is_approved = false AND verification_status != 'rejected' THEN 'pending'
     ELSE verification_status
   END
   WHERE verification_status IS NULL OR (
     (is_approved = true AND verification_status != 'verified') OR
     (is_approved = false AND verification_status = 'verified')
   );
   ```

3. **Add database constraint:**
   ```sql
   ALTER TABLE profiles ADD CONSTRAINT verification_status_consistency
   CHECK (
     (verification_status = 'verified' AND is_approved = true) OR
     (verification_status IN ('pending', 'rejected') AND is_approved = false)
   );
   ```

4. **Update all code references:**
   - OnboardingGuard: Use only `verification_status`
   - Admin approval functions: Update both fields atomically
   - Frontend components: Use only `verification_status`

### Files to Modify
- `db/migrations/055_consolidate_approval_fields.sql`
- `src/routes/OnboardingGuard.tsx`
- `src/features/admin/pages/AdminCenter.tsx`
- `src/features/auth/pages/auth/PendingApproval.tsx`

### Acceptance Criteria
- [ ] All existing users have consistent state
- [ ] Database constraint prevents inconsistency
- [ ] All code uses `verification_status` as source of truth
- [ ] `is_approved` is kept in sync for backward compatibility

### Testing
```sql
-- Should fail: inconsistent state
UPDATE profiles SET verification_status = 'verified', is_approved = false WHERE id = '...';

-- Should succeed: consistent state
UPDATE profiles SET verification_status = 'verified', is_approved = true WHERE id = '...';
```

---

## Phase 6: Add User Re-Application Workflow
**Priority:** 🟡 P2  
**Finding:** MEDIUM-7  
**Estimated Effort:** 1 day

### Problem
Rejected users have no way to appeal or re-apply.

### Tasks
1. **Create re-review request table:**
   ```sql
   CREATE TABLE verification_appeals (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id) NOT NULL,
     appeal_reason text NOT NULL,
     additional_info text,
     submitted_at timestamptz DEFAULT now(),
     reviewed_at timestamptz,
     reviewed_by uuid REFERENCES auth.users(id),
     status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
     admin_notes text
   );
   ```

2. **Update AccountRejected page:**
   - Add "Request Review" button
   - Show appeal form with reason field
   - Submit appeal to database

3. **Add admin UI for appeals:**
   - Show pending appeals in AdminCenter
   - Allow approve/reject with notes
   - On approve: reset user to 'pending' status

4. **Add RLS policies for appeals table**

### Files to Create/Modify
- `db/migrations/056_verification_appeals.sql`
- `src/features/auth/pages/auth/AccountRejected.tsx`
- `src/features/admin/pages/AdminCenter.tsx`
- `src/features/admin/components/VerificationAppeals.tsx` (new)

### Acceptance Criteria
- [ ] Rejected users can submit appeal
- [ ] Admins see pending appeals
- [ ] Admins can approve/reject appeals
- [ ] Approved appeals reset user to pending status
- [ ] Email notifications sent (if email system enabled)

### Testing
```typescript
// As rejected user: submit appeal
// As admin: view and approve appeal
// Verify user can now complete onboarding
```

---

## Phase 7: Fix Court Officer Lighting Permissions
**Priority:** 🟡 P2  
**Finding:** MEDIUM-8  
**Estimated Effort:** 3 hours

### Problem
Court Officers have `write` access to lighting but only `read` access to spaces, creating workflow inconsistency.

### Solution Options

**Option A:** Grant Court Officers write access to spaces (lighting-related fields only)
- Pros: Allows complete lighting workflow
- Cons: Requires field-level RLS (complex)

**Option B:** Create dedicated lighting management role
- Pros: Clear separation of concerns
- Cons: Adds another role

**Option C (Recommended):** Grant Court Officers `write` access to spaces
- Simpler implementation
- Court Officers already manage building security
- Lighting fixtures are part of building infrastructure

### Tasks
1. **Update role permissions:**
   ```typescript
   court_officer: {
     spaces: 'write',  // Changed from 'read'
     lighting: 'write',
     // ...
   }
   ```

2. **Update RLS policies:**
   - Ensure court_officer can update rooms/hallways
   - Add audit logging for space modifications

3. **Test lighting walkthrough workflow:**
   - Create fixtures
   - Run walkthrough
   - Update fixture status

### Files to Modify
- `src/features/auth/hooks/useRolePermissions.ts`
- `db/migrations/057_court_officer_space_write.sql`

### Acceptance Criteria
- [ ] Court Officers can create/edit lighting fixtures
- [ ] Court Officers can run lighting walkthroughs
- [ ] Court Officers can update space lighting data
- [ ] Audit trail captures all modifications

---

## Phase 8: Fix CMC Role Permissions for Spaces
**Priority:** 🟡 P2  
**Finding:** MEDIUM-9  
**Estimated Effort:** 3 hours

### Problem
CMC can schedule court sessions but cannot view courtroom spaces.

### Tasks
1. **Grant CMC read access to spaces:**
   ```typescript
   cmc: {
     spaces: 'read',  // Changed from null
     court_operations: 'write',
     // ...
   }
   ```

2. **Add courtroom filtering (optional):**
   - CMC should see all spaces (they need context)
   - Or filter to courtroom-type spaces only

3. **Update RLS policies:**
   - Ensure CMC can read rooms, hallways, buildings
   - No write access needed

4. **Test court scheduling workflow:**
   - CMC views available courtrooms
   - CMC schedules session in specific courtroom
   - CMC sees courtroom capacity/equipment

### Files to Modify
- `src/features/auth/hooks/useRolePermissions.ts`
- `db/migrations/058_cmc_space_read.sql`

### Acceptance Criteria
- [ ] CMC can view all spaces
- [ ] CMC can see courtroom details
- [ ] CMC cannot edit spaces
- [ ] Court scheduling workflow works end-to-end

---

## Phase 9: Define Purchasing Role Workflows
**Priority:** 🟡 P2  
**Finding:** MEDIUM-10  
**Estimated Effort:** 4 hours

### Problem
Purchasing role is read-only everywhere with no clear workflow.

### Decision Required
**Option A:** Remove purchasing role (if unused)
**Option B:** Define purchasing workflows with write permissions

### Recommended: Option B - Define Workflows

### Tasks
1. **Interview stakeholders:** Determine what purchasing staff need to do

2. **Update role permissions (example):**
   ```typescript
   purchasing: {
     inventory: 'write',        // Manage inventory levels
     supply_requests: 'write',  // Approve high-value requests
     supply_orders: 'admin',    // Create purchase orders
     // ...
   }
   ```

3. **Create purchasing-specific features:**
   - Purchase order creation
   - Vendor management
   - Budget tracking
   - Approval workflows for high-value items

4. **Update RLS policies**

### Files to Modify
- `src/features/auth/hooks/useRolePermissions.ts`
- `src/features/purchasing/` (new module)
- `db/migrations/059_purchasing_workflows.sql`

### Acceptance Criteria
- [ ] Purchasing role has clear responsibilities
- [ ] Purchasing staff can perform their workflows
- [ ] Documentation explains purchasing role

**Note:** This phase may require user research to define requirements.

---

## Phase 10: Fix Audit Table RLS Policies
**Priority:** 🟡 P2  
**Finding:** MEDIUM-12  
**Estimated Effort:** 3 hours

### Problem
Audit tables use `WITH CHECK (true)`, allowing users to forge audit logs for others.

### Tasks
1. **Identify all audit tables:**
   - `admin_actions`
   - `security_audit_log`
   - `issue_audit_history`
   - `supply_audit_log`
   - `key_audit_log`
   - Others?

2. **Update INSERT policies:**
   ```sql
   CREATE POLICY audit_insert ON admin_actions
     FOR INSERT TO authenticated
     WITH CHECK (user_id = auth.uid() OR is_admin());
   ```

3. **Add validation for required fields:**
   ```sql
   WITH CHECK (
     user_id = auth.uid() AND
     action IS NOT NULL AND
     created_at IS NOT NULL
   );
   ```

4. **Prevent UPDATE/DELETE on audit tables:**
   ```sql
   -- No UPDATE policy = no updates allowed
   -- No DELETE policy = no deletes allowed
   ```

### Files to Create
- `db/migrations/060_audit_table_rls.sql`

### Acceptance Criteria
- [ ] Users can only insert audit logs for themselves
- [ ] Admins can insert logs for others (if needed)
- [ ] Audit logs cannot be modified or deleted
- [ ] All required fields are validated

### Testing
```sql
-- Should succeed: user inserts own audit log
INSERT INTO admin_actions (user_id, action) VALUES (auth.uid(), 'test');

-- Should fail: user tries to insert for another user
INSERT INTO admin_actions (user_id, action) VALUES ('<other_user_id>', 'test');

-- Should fail: user tries to update audit log
UPDATE admin_actions SET action = 'modified' WHERE id = '...';
```

---

## Phase 11: Add Onboarding Improvements and Help System
**Priority:** 🟡 P2  
**Findings:** MEDIUM-14, MEDIUM-15  
**Estimated Effort:** 2 days

### Problem
New users have poor onboarding experience with no guidance or training.

### Tasks

#### 11A: Improve Approval Flow Communication
1. **Add email notifications:**
   - Send email when user is approved
   - Send email when user is rejected (with reason)
   - Send email when appeal is reviewed

2. **Update PendingApproval page:**
   - Show estimated approval time
   - Show contact info for questions
   - Add status polling (check every 30s)

3. **Update AccountRejected page:**
   - Show rejection reason clearly
   - Provide next steps
   - Show appeal option

#### 11B: Add Role-Specific Onboarding Tours
1. **Create onboarding tour component:**
   - Use library like `react-joyride` or `intro.js`
   - Define tours for each role
   - Store completion status in user preferences

2. **Define tour steps per role:**
   - **Standard User:** Submit issue, request supplies, view dashboard
   - **Court Aide:** Fulfill orders, manage inventory, complete tasks
   - **Court Officer:** Manage keys, view spaces, run lighting walkthrough
   - **CMC:** Schedule sessions, manage courtrooms, view calendar
   - **Admin:** Approve users, manage settings, view command center

3. **Add "Help" button to navigation:**
   - Restart tour
   - View role-specific help docs
   - Contact support

#### 11C: Create Help Center
1. **Add help center page:**
   - FAQ section
   - Video tutorials (embedded YouTube/Vimeo)
   - Role-specific guides
   - Contact form

2. **Create documentation:**
   - User guides for each role
   - Common workflows
   - Troubleshooting tips

### Files to Create/Modify
- `src/features/onboarding/components/OnboardingTour.tsx` (new)
- `src/features/onboarding/config/tourSteps.ts` (new)
- `src/features/help/pages/HelpCenter.tsx` (new)
- `src/features/auth/pages/auth/PendingApproval.tsx`
- `src/features/auth/pages/auth/AccountRejected.tsx`
- `docs/user-guides/` (new directory)

### Acceptance Criteria
- [ ] Users receive email notifications for approval/rejection
- [ ] Pending approval page shows helpful info
- [ ] New users see onboarding tour on first login
- [ ] Help center is accessible from navigation
- [ ] Documentation covers all major workflows

---

## Phase 12: Add Pagination to Large Data Sets
**Priority:** 🟡 P2  
**Finding:** MEDIUM-19  
**Estimated Effort:** 1 day

### Problem
List views fetch all records without pagination, causing performance issues as data grows.

### Tasks
1. **Implement cursor-based pagination:**
   - More efficient than offset-based
   - Works well with Supabase
   - Handles real-time updates better

2. **Update affected pages:**
   - `/admin` - User list
   - `/admin/supply-requests` - Supply request list
   - `/operations` - Issues list
   - `/keys` - Key request list
   - `/inventory` - Inventory items list

3. **Create reusable pagination component:**
   ```typescript
   interface PaginationProps {
     currentPage: number;
     totalPages: number;
     onPageChange: (page: number) => void;
     pageSize: number;
     onPageSizeChange: (size: number) => void;
   }
   ```

4. **Add pagination to queries:**
   ```typescript
   const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
     queryKey: ['users', filters],
     queryFn: ({ pageParam = 0 }) => getUsers({ 
       offset: pageParam, 
       limit: 50 
     }),
     getNextPageParam: (lastPage, pages) => 
       lastPage.length === 50 ? pages.length * 50 : undefined,
   });
   ```

### Files to Create/Modify
- `src/shared/components/pagination/Pagination.tsx` (new)
- `src/shared/hooks/usePagination.ts` (new)
- `src/features/admin/pages/AdminCenter.tsx`
- `src/features/admin/pages/admin/SupplyRequests.tsx`
- `src/features/operations/pages/Operations.tsx`
- `src/features/keys/pages/Keys.tsx`
- `src/features/inventory/pages/InventoryDashboard.tsx`

### Acceptance Criteria
- [ ] All list views use pagination
- [ ] Page size is configurable (25, 50, 100)
- [ ] Pagination component is reusable
- [ ] Performance improves with large datasets
- [ ] Infinite scroll option available

---

## Implementation Order

### Week 1: High Priority Security & Workflow Fixes
- **Day 1-2:** Phase 1 (Supply Room backdoor) + Phase 2 (RLS audit)
- **Day 3:** Phase 3 (Lighting RLS policies)
- **Day 4:** Phase 7 (Court Officer permissions) + Phase 8 (CMC permissions)
- **Day 5:** Phase 4 (Status validation) + Phase 10 (Audit table RLS)

### Week 2: Medium Priority Improvements
- **Day 6:** Phase 5 (Consolidate approval fields)
- **Day 7:** Phase 6 (Re-application workflow)
- **Day 8-9:** Phase 11 (Onboarding & help system)
- **Day 10:** Phase 12 (Pagination)

### Week 3: Optional/Deferred
- **Phase 9:** Purchasing role workflows (requires stakeholder input)

---

## Testing Strategy

### Per-Phase Testing
Each phase includes specific test cases in its section above.

### Integration Testing
After all phases complete:
1. **End-to-end workflow tests:**
   - User signup → approval → first login → complete task
   - Supply request → approval → fulfillment → pickup
   - Issue report → assignment → resolution
   - Key request → approval → assignment → return

2. **Role-based access tests:**
   - Test each role's permissions
   - Verify RLS policies work correctly
   - Ensure no permission escalation

3. **Performance tests:**
   - Load test with 1000+ users
   - Load test with 10,000+ supply requests
   - Verify pagination works under load

### Regression Testing
- Run existing test suite after each phase
- Verify no breaking changes to existing functionality

---

## Rollback Plan

Each migration includes a rollback script:

```sql
-- Migration 050: Add supply_room_staff role
-- Rollback:
DELETE FROM user_roles WHERE role = 'supply_room_staff';
-- Restore department-based permissions in code
```

Store rollback scripts in `db/rollbacks/` directory.

---

## Success Metrics

### Security
- ✅ Zero permission escalation vulnerabilities
- ✅ All tables have appropriate RLS policies
- ✅ Audit logs are tamper-proof

### Functionality
- ✅ All role-based workflows work end-to-end
- ✅ No permission mismatches between frontend/backend
- ✅ Status transitions are validated

### User Experience
- ✅ New users complete onboarding successfully
- ✅ Help system reduces support tickets
- ✅ Pagination improves page load times

### Code Quality
- ✅ TypeScript compilation passes
- ✅ All tests pass
- ✅ No new `any` types introduced

---

## Risk Mitigation

### High-Risk Changes
- **Phase 2 (RLS audit):** Could break existing permissions
  - Mitigation: Test thoroughly in staging environment
  - Mitigation: Deploy during low-usage window
  - Mitigation: Have rollback script ready

- **Phase 5 (Approval consolidation):** Data migration could fail
  - Mitigation: Backup database before migration
  - Mitigation: Test migration on copy of production data
  - Mitigation: Run migration in transaction (can rollback)

### Dependencies
- **Phase 7 & 8** depend on **Phase 2** (RLS audit)
- **Phase 11** depends on **Phase 6** (re-application workflow)

---

## Post-Implementation

### Documentation Updates
- Update README.md with new features
- Update API documentation
- Create admin guide for new workflows
- Update user guides

### Monitoring
- Add error tracking for new features
- Monitor RLS policy performance
- Track onboarding completion rates
- Monitor pagination performance

### Training
- Train admins on new approval workflows
- Train court officers on lighting permissions
- Train CMC on space access

---

## Conclusion

This plan addresses **17 critical and medium findings** from the audit in **12 phases** over **2-3 weeks**. Each phase is independent, testable, and includes rollback procedures.

**Total Estimated Effort:** 10-12 days  
**Recommended Timeline:** 2-3 weeks (accounting for testing and review)

After completion, the system will have:
- ✅ Secure, consistent permission system
- ✅ Validated workflows with database-level enforcement
- ✅ Better user experience with onboarding and help
- ✅ Scalable architecture with pagination
- ✅ Clear role definitions and responsibilities

**The system will be production-ready** (pending email verification and MFA implementation).
