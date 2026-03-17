
Goal: turn the Admin Center from a single “user list + system tab” into a true control hub with fewer clicks, clearer actions, and complete account lifecycle management.

What I found
- The current `/admin` page already has some strong backend capabilities:
  - full delete via `admin_delete_user`
  - approve/reject pending users
  - role changes
  - account unlock via rate-limit reset
- But the experience is still shallow:
  - almost everything is buried inside one Users tab
  - destructive/admin actions are scattered across card menus
  - there is no visible “account actions” model for admins
  - the login page says “contact your administrator” for forgot password, even though a real `requestPasswordReset()` service already exists
  - there is no `/reset-password` or `/auth/reset` page/route wired up, so the reset flow is incomplete
- Navigation also adds friction:
  - sidebar has “Admin Center” plus “System Settings” separately, even though `/system-settings` already redirects back into `/admin?tab=system`
  - admin tools like routing rules/form builder still live outside a unified admin experience

Recommended first-pass redesign
1. Restructure Admin Center into clear top-level sections
   - Overview
   - User Accounts
   - Security & Access
   - System Tools
   - Advanced / Dangerous Actions

2. Add an admin overview screen
   - counts for pending, active, suspended, admins
   - cards for “Needs attention”
   - shortcuts: approve pending, reset password, unlock user, suspend/deactivate, permanent delete

3. Upgrade User Accounts into a fuller “account control” workspace
   - split views: Pending, Active, Suspended, Admins
   - each row/card shows role, approval, suspension, last activity if available
   - action group per user:
     - approve/reject
     - change role
     - send password reset email
     - unlock account
     - deactivate/suspend
     - permanently delete
   - keep hard delete, but place it behind stronger confirmations

4. Implement both deletion modes
   - Soft deactivate:
     - preferred default for admin safety
     - blocks access, hides from active lists, preserves audit/history
   - Permanent delete:
     - uses existing `admin_delete_user`
     - only available as a separate destructive action
     - require typed confirmation like email/name before execution

5. Fix password recovery properly
   - replace the “contact your administrator” forgot-password button with a real reset request flow
   - create a public reset-password page
   - wire route + recovery handling + password update form
   - in Admin Center add “Send reset email” as a one-click action for admins

6. Reduce click depth and consolidate navigation
   - keep `/admin` as the main hub
   - absorb “System Settings” into admin sections instead of feeling like a separate destination
   - optionally surface links to Routing Rules / Form Builder inside the admin hub as cards or sub-tabs
   - remove redundant sidebar/admin entry points where possible

Concrete implementation plan
Phase 1: Audit + UX cleanup
- Refactor `src/pages/AdminCenter.tsx` into smaller admin subcomponents
- Introduce overview cards and sectioned tabs/subtabs
- Bring existing hidden powers into visible quick actions
- Reuse existing confirm dialog patterns

Phase 2: Password reset flow
- Update login UI to use the existing reset service
- Add a public reset password page and route
- Handle Supabase recovery tokens and `updateUser({ password })`
- Add admin “Send password reset email” action from the user management view

Phase 3: Soft deactivate / suspension workflow
- Check current schema support for suspension fields/functions
- If needed, add migration + secure RPC for suspend/reactivate users
- Expose deactivate/reactivate in Admin Center
- Keep permanent delete as a second-level destructive path

Phase 4: Admin information architecture
- Merge “system” tools, rate-limit tools, module management, and database tools into clearer admin sections
- Add shortcut panels so admins do not need to bounce across multiple screens
- Optionally create deep links like `/admin?tab=accounts&filter=pending`

Key files likely involved
- `src/pages/AdminCenter.tsx`
- `src/components/layout/config/navigation.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/services/auth.ts`
- `src/App.tsx`
- new page/component for password reset flow
- possibly new migration/RPC if suspension/deactivation needs backend hardening

Technical notes
- Permanent deletion already exists and should remain RPC-driven for security.
- Password reset should use Supabase’s standard recovery flow, not manual password setting by admins.
- For soft deactivate, roles must stay in `user_roles` and admin checks must remain server-side.
- If we add suspend/reactivate RPCs, they should follow the project’s existing SECURITY DEFINER + role-check pattern.

Suggested scope for the first implementation pass
- Build the new Admin Center layout
- Add admin quick actions
- Add real forgot/reset password flow
- Add soft deactivate/reactivate
- Keep permanent delete as advanced destructive action

That gives the biggest usability win without trying to redesign every admin-adjacent module at once.
