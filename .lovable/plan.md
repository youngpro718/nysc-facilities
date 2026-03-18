

## Login Screen Text Color Fix

### Problem
The login screen forces a `.light` theme, but the light theme's `--primary` color is `0 0% 9%` (near-black grayscale). This makes interactive elements like "Forgot password?", "Need an account?", the shield icon, and the "Sign In" button all appear in near-black — visually indistinguishable from regular body text. Nothing looks "clickable" or branded.

Additionally, the app's root element carries the `dark` class, but the `.light` class on the login wrapper should correctly override CSS variables for all children — so the variable cascade itself is fine, the issue is purely that the light theme primary is bland grayscale.

### Fix
Give the login screen a proper branded primary color instead of the generic grayscale. Two options:

**Option A — Scoped override on login wrapper only**
Add a few CSS variable overrides directly on the login page's wrapper `style` prop (or a scoped class) so that `text-primary`, button backgrounds, and link colors use a court-system-appropriate blue (e.g., `221 83% 53%` — the same blue already defined in the `.blue` theme class in `index.css`). This keeps the rest of the app's light/dark themes untouched.

**Option B — Update the `.light` class primary globally**
Change `--primary` in `.light` from grayscale to the branded blue. This affects anywhere `.light` is used.

### Recommendation
**Option A** — scoped to the login page only. Changes needed:

1. **`src/features/auth/pages/LoginPage.tsx`** — add CSS variable overrides on the wrapper div's `style` for `--primary`, `--primary-foreground`, and `--ring` to use a visible blue color.

2. **`src/features/auth/components/auth/SecureLoginForm.tsx`** — no structural changes needed; the `text-primary` classes will automatically pick up the blue from the parent's CSS variable override.

3. **`src/features/auth/components/security/SecureForm.tsx`** — same, no changes needed.

### Scope
- Single file edit (`LoginPage.tsx`) — add 3 CSS custom property overrides to the existing inline `style` object
- No theme file changes, no new components

