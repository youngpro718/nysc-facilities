

# Plan: System Menu Audit + PersonDetailSheet Mobile Fix

## Issues Found

### A. DatabaseSection Double Card Nesting
`AdminCenter` wraps `DatabaseSection` inside a `<Card><CardContent>`, but `DatabaseSection` itself renders another `<Card className="p-6">` with its own "Database Management" header. This creates a card-inside-card visual issue and a duplicate "Database Management" title (one from AdminCenter's CardHeader, one from DatabaseSection's internal h2).

### B. Retention Policy Button Has No Customization
"Add Retention Policy" always creates the exact same default policy (30 days, 5 max, compressed, encrypted). Users have accumulated 4 identical policies. The button should either be removed or open a form.

### C. Information Tab Content is Generic
The "Important Notes" section is fine but static. No issues here beyond being boilerplate.

### D. Module Management Works Correctly
The toggle mechanism persists to `profiles.enabled_modules` and invalidates caches. The module catalog merges DB records with a hardcoded default list. This is functional.

### E. PersonDetailSheet Close Button / Header Too High on iPhone
The right-side sheet applies `pt-[env(safe-area-inset-top)]` for the container and positions the close button at `top: calc(env(safe-area-inset-top) + 8px)`. On iOS this should technically clear the notch, but the user reports it's still too tight. The SheetHeader content starts immediately after the safe-area padding with only `p-3` (12px) between the top edge and the avatar/title. The close button (absolutely positioned) overlaps or crowds the header.

**Root cause**: The SheetHeader in PersonDetailSheet has no additional top margin to account for the close button's height (~44px tap target). On mobile, the header content needs to be pushed below the close button.

---

## Plan

### 1. Fix DatabaseSection Double Nesting
- Remove the inner `<Card className="p-6">` wrapper and the duplicate "Database Management" h2/icon header from `DatabaseSection.tsx`
- Keep only the outer Card provided by AdminCenter's SystemSettingsContent
- Render the action buttons (Backup History, Add Retention Policy) in a toolbar row at the top of DatabaseSection

### 2. Remove "Add Retention Policy" Button (or make it useful)
- Remove the standalone "Add Retention Policy" button since it creates duplicate identical policies
- The retention policies tab already displays existing policies; if the user needs to create one, they can use the Supabase dashboard
- Alternative: keep the button but prevent duplicates by checking if a default policy already exists

### 3. Fix PersonDetailSheet Header Spacing on Mobile
- Add `pt-14` (56px) top padding to the `SheetHeader` in `PersonDetailSheet.tsx` on mobile to push the avatar/title/badges well below both the notch safe area AND the close button
- Use responsive classes: `pt-14 sm:pt-2` so desktop is unaffected
- This ensures the close X button (at ~47-59px from top on notched iPhones + 8px + 44px tap target) doesn't overlap the content

### 4. Increase Close Button Offset in Sheet Component
- Change the close button's top position from `calc(env(safe-area-inset-top) + 8px)` to `calc(env(safe-area-inset-top) + 12px)` for right-side sheets to give more breathing room below the notch

---

## Files to Edit
- `src/components/profile/DatabaseSection.tsx` — remove inner Card wrapper and duplicate header
- `src/components/access-assignments/PersonDetailSheet.tsx` — add mobile top padding to SheetHeader
- `src/components/ui/sheet.tsx` — slightly increase close button top offset for right-side sheets

