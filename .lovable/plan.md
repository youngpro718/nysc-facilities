

## Fix iOS Sizing for Sheet Component and App Layout

### Problem
The PersonDetailSheet (and sheets in general) don't properly account for iOS safe areas — the Dynamic Island/notch at the top and the home indicator at the bottom. The close button crowds the status bar, and content can be hidden behind the home indicator.

### iOS Device Dimensions (CSS points, for reference)
- iPhone 16 Pro Max: 440×956
- iPhone 16 Pro: 402×874
- iPhone 15 Pro Max / 14 Pro Max: 430×932
- iPhone 15 Pro / 15 / 14 Pro: 393×852
- iPhone SE 3: 375×667

The viewport meta tag (`viewport-fit=cover`) is already correct — this tells Safari to extend content into safe areas, but the app must then use `env(safe-area-inset-*)` to pad content away from the notch and home indicator.

### Changes

**1. `src/components/ui/sheet.tsx`** — Add safe area padding to the right-side sheet variant:
- Add `pt-safe` (or `padding-top: env(safe-area-inset-top)`) so the header clears the Dynamic Island
- Add `pb-safe` so bottom content clears the home indicator
- Make the right-side sheet `w-full` on mobile instead of `w-3/4` (the 75% width looks cramped on phones)

**2. `src/components/access-assignments/PersonDetailSheet.tsx`** — Minor adjustments:
- Ensure the close button has enough top offset to clear the status bar area
- The sheet content's flex layout already handles overflow well; just needs the safe-area padding from the parent

**3. Add iPhone 16 Pro / 16 Pro Max splash screen entries** to `index.html` (440×956 and 402×874 are new device sizes not currently covered in the splash screen list)

