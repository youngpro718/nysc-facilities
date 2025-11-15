# Step 3: Auth Services Integration Plan

**Date:** October 26, 2025, 10:49 AM UTC-04:00  
**Status:** 🔄 **IN PROGRESS**

---

## 📊 Integration Strategy

### **Goal**
Integrate the new auth services (`src/services/auth.ts` and `src/services/profile.ts`) with existing hooks while maintaining backward compatibility.

---

## 🎯 **Integration Points**

### **1. useAuth Hook** 
**File:** `src/hooks/useAuth.tsx`

**Current Implementation:**
- Uses `authService` from `@/lib/supabase`
- Has signIn, signUp, signOut functions
- Manages session state
- Handles user profile fetching

**Integration Plan:**
```typescript
// Import new services
import * as authServices from '@/services/auth';
import * as profileServices from '@/services/profile';

// Update signIn to use new service with email verification
const signIn = async (email: string, password: string) => {
  try {
    // Use new service that enforces email verification
    const user = await authServices.signIn(email, password);
    
    // Fetch profile using new service
    const profile = await profileServices.getMyProfile();
    
    // Update state
    setUser(user);
    setProfile(profile);
    
    toast.success('Welcome back!');
  } catch (error: any) {
    if (error.message.includes('Email not verified')) {
      toast.error('Email not verified', {
        description: 'Please check your email and verify your account.',
        action: {
          label: 'Resend',
          onClick: () => authServices.resendVerificationEmail(email)
        }
      });
    }
    throw error;
  }
};
```

**Benefits:**
- ✅ Email verification enforced
- ✅ Better error messages
- ✅ Resend verification option
- ✅ Maintains existing API

---

### **2. useOnboarding Hook**
**File:** `src/hooks/useOnboarding.ts`

**Current Implementation:**
- Manages onboarding flow
- Checks if user needs onboarding
- Updates onboarding status

**Integration Plan:**
```typescript
import { getMyProfile, markUserAsOnboarded } from '@/services/profile';

// Check if user needs onboarding
const needsOnboarding = async () => {
  const profile = await getMyProfile();
  return !profile.onboarded;
};

// Complete onboarding
const completeOnboarding = async () => {
  const profile = await getMyProfile();
  await markUserAsOnboarded(profile.id);
};
```

**Benefits:**
- ✅ Uses new profile service
- ✅ Type-safe operations
- ✅ Consistent with RLS policies

---

### **3. Login Components**
**Files:** 
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SecureLoginForm.tsx`

**Current Implementation:**
- Uses useAuth hook
- Basic error handling

**Enhancement Plan:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  try {
    await signIn(email, password);
    // Success handled by useAuth
  } catch (error: any) {
    if (error.message.includes('Email not verified')) {
      setShowResendButton(true);
    }
    setError(error.message);
  }
};

const handleResendVerification = async () => {
  try {
    await resendVerificationEmail(email);
    toast.success('Verification email sent!');
  } catch (error) {
    toast.error('Failed to resend verification email');
  }
};
```

**UI Enhancement:**
```tsx
{error && error.includes('Email not verified') && (
  <Alert>
    <AlertDescription>
      Your email is not verified.
      <Button onClick={handleResendVerification}>
        Resend Verification Email
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

### **4. Signup Components**
**Files:**
- `src/components/auth/SignupForm.tsx`

**Current Implementation:**
- Uses useAuth hook
- Basic signup flow

**Enhancement Plan:**
```typescript
import { signUp } from '@/services/auth';

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  try {
    await signUp(email, password, fullName);
    
    // Show success message
    toast.success('Account created!', {
      description: 'Please check your email to verify your account.'
    });
    
    // Navigate to verification pending page
    navigate('/verification-pending');
  } catch (error: any) {
    setError(error.message);
  }
};
```

**New Verification Pending Page:**
```tsx
// src/pages/VerificationPending.tsx
export function VerificationPending() {
  const [email] = useState(localStorage.getItem('signup_email'));
  
  return (
    <div>
      <h1>Check Your Email</h1>
      <p>We've sent a verification link to {email}</p>
      <Button onClick={() => resendVerificationEmail(email)}>
        Resend Verification Email
      </Button>
    </div>
  );
}
```

---

### **5. Admin User Management**
**New File:** `src/components/admin/UserManagement.tsx`

**Features:**
- List all users
- Assign roles
- Enforce MFA
- Mark as onboarded
- View user details

**Implementation:**
```typescript
import {
  getAllProfiles,
  assignRole,
  setMfaEnforcement,
  markUserAsOnboarded,
  getProfilesByRole
} from '@/services/profile';

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    const profiles = await getAllProfiles();
    setUsers(profiles);
  };
  
  const handleAssignRole = async (userId: string, role: Role) => {
    await assignRole(userId, role);
    await loadUsers();
    toast.success('Role assigned successfully');
  };
  
  const handleEnforceMFA = async (userId: string, enforced: boolean) => {
    await setMfaEnforcement(userId, enforced);
    await loadUsers();
    toast.success(`MFA ${enforced ? 'enabled' : 'disabled'}`);
  };
  
  return (
    <div>
      <DataTable
        data={users}
        columns={[
          { header: 'Email', accessor: 'email' },
          { header: 'Name', accessor: 'full_name' },
          { header: 'Role', accessor: 'role' },
          { header: 'Onboarded', accessor: 'onboarded' },
          { header: 'MFA', accessor: 'mfa_enforced' },
          {
            header: 'Actions',
            cell: (user) => (
              <UserActionsMenu
                user={user}
                onAssignRole={handleAssignRole}
                onEnforceMFA={handleEnforceMFA}
              />
            )
          }
        ]}
      />
    </div>
  );
}
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Core Integration** 🔄
- [ ] Update useAuth hook to use new auth service
- [ ] Add email verification enforcement
- [ ] Add resend verification functionality
- [ ] Update error handling
- [ ] Test sign in flow
- [ ] Test sign up flow

### **Phase 2: UI Updates** ⏳
- [ ] Update LoginForm with verification error handling
- [ ] Add "Resend Verification" button
- [ ] Create VerificationPending page
- [ ] Update SignupForm with new flow
- [ ] Add email verification instructions
- [ ] Test UI flows

### **Phase 3: Profile Integration** ⏳
- [ ] Update useOnboarding to use profile service
- [ ] Add profile management UI
- [ ] Test onboarding flow
- [ ] Verify RLS policies work correctly

### **Phase 4: Admin Features** ⏳
- [ ] Create UserManagement component
- [ ] Add role assignment UI
- [ ] Add MFA enforcement UI
- [ ] Add onboarding management
- [ ] Test coordinator permissions

### **Phase 5: Testing** ⏳
- [ ] Unit tests for auth service integration
- [ ] Integration tests for auth flows
- [ ] E2E tests for sign up → verify → sign in
- [ ] Test role-based access control
- [ ] Test MFA enforcement

---

## 🔒 **Security Considerations**

### **Email Verification**
- ✅ Enforced at service layer
- ✅ Auto signs out unverified users
- ✅ Clear error messages
- ✅ Resend option available

### **Role-Based Access**
- ✅ RLS policies at database level
- ✅ Service layer validates permissions
- ✅ UI hides unauthorized actions
- ✅ Type-safe role definitions

### **Session Management**
- ✅ Existing session tracking maintained
- ✅ Auto refresh tokens
- ✅ Secure sign out clears all data

---

## 🎯 **Success Criteria**

### **Functional:**
- ✅ Users must verify email before signing in
- ✅ Unverified users see clear error message
- ✅ Resend verification works
- ✅ Role-based access enforced
- ✅ Coordinators can manage users

### **Technical:**
- ✅ TypeScript compilation clean
- ✅ No breaking changes to existing code
- ✅ All tests passing
- ✅ RLS policies enforced

### **User Experience:**
- ✅ Clear error messages
- ✅ Helpful instructions
- ✅ Easy to resend verification
- ✅ Smooth onboarding flow

---

## 📊 **Testing Strategy**

### **Unit Tests:**
```typescript
describe('useAuth with new services', () => {
  it('should enforce email verification on sign in', async () => {
    // Mock unverified user
    mockSignIn.mockRejectedValue(new Error('Email not verified'));
    
    await expect(signIn('test@example.com', 'password'))
      .rejects.toThrow('Email not verified');
  });
  
  it('should allow resending verification email', async () => {
    await resendVerificationEmail('test@example.com');
    expect(mockResend).toHaveBeenCalledWith('test@example.com');
  });
});
```

### **Integration Tests:**
```typescript
describe('Auth flow integration', () => {
  it('should complete full signup and verification flow', async () => {
    // 1. Sign up
    await signUp('test@example.com', 'password', 'Test User');
    
    // 2. Verify email (mock)
    await verifyEmail('test@example.com');
    
    // 3. Sign in
    const user = await signIn('test@example.com', 'password');
    expect(user.email_confirmed_at).toBeTruthy();
  });
});
```

### **E2E Tests:**
```typescript
describe('User journey', () => {
  it('should prevent unverified user from signing in', async () => {
    // Sign up
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Try to sign in without verifying
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Should see error
    await expect(page.locator('text=Email not verified')).toBeVisible();
    
    // Should see resend button
    await expect(page.locator('text=Resend')).toBeVisible();
  });
});
```

---

## 🚀 **Rollout Plan**

### **Week 1: Core Integration**
- Day 1-2: Update useAuth hook
- Day 3: Update login/signup components
- Day 4: Create verification pending page
- Day 5: Testing and bug fixes

### **Week 2: Admin Features**
- Day 1-2: Create UserManagement component
- Day 3: Add role assignment UI
- Day 4: Add MFA enforcement
- Day 5: Testing and refinement

### **Week 3: Polish & Deploy**
- Day 1-2: E2E testing
- Day 3: Documentation updates
- Day 4: Staging deployment
- Day 5: Production deployment

---

## 📝 **Documentation Updates Needed**

1. **README.md**
   - Add email verification requirement
   - Document new auth flow
   - Add troubleshooting section

2. **ENVIRONMENT_SETUP.md**
   - Add email configuration
   - Document SMTP settings
   - Add verification URL setup

3. **API Documentation**
   - Document new auth services
   - Add profile service docs
   - Include code examples

4. **User Guide**
   - Email verification process
   - Resend verification instructions
   - Role-based access explanation

---

## 🎯 **Next Actions**

### **Immediate:**
1. Review this integration plan
2. Approve approach
3. Start Phase 1 implementation

### **This Week:**
1. Complete core integration
2. Update UI components
3. Test auth flows

### **Next Week:**
1. Build admin features
2. Complete testing
3. Deploy to staging

---

**Status:** 🔄 **READY TO IMPLEMENT**  
**Estimated Time:** 2-3 weeks  
**Risk Level:** 🟡 Low (backward compatible)
