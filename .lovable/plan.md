

## Problem

The Sheet (cart drawer) uses `h-screen` (100vh) which on iOS includes the area behind the browser chrome and home indicator. Even with `pb-safe`, the bottom buttons get clipped or hidden behind the BottomTabBar on mobile.

## Root Cause

In `src/components/ui/sheet.tsx` line 27, the right-side variant uses `h-screen` which equals `100vh` — on iOS Safari this includes the area behind toolbars and safe areas, causing content to overflow below the visible area.

## Fix

### 1. Sheet component: use `h-dvh` instead of `h-screen` (sheet.tsx, line 27)

Change the right-side variant from `h-screen` to `h-dvh` (dynamic viewport height). This uses `100dvh` which accounts for browser chrome and is supported on all modern iOS versions.

```
// Before
"inset-y-0 right-0 h-screen w-3/4 ..."

// After  
"inset-y-0 right-0 h-dvh w-3/4 ..."
```

### 2. Increase bottom padding in OrderCart SheetContent (OrderCart.tsx, line 81)

Change `pb-safe` to `pb-20` to provide a generous fixed bottom padding that clears the BottomTabBar area on mobile, since the Sheet renders at z-100 (above the tab bar at z-40) but the visual overlap still confuses users.

```
// Before
<SheetContent className="w-full sm:max-w-md flex flex-col pb-safe">

// After
<SheetContent className="w-full sm:max-w-md flex flex-col pb-20 sm:pb-6">
```

This gives 80px of bottom padding on mobile (clearing the ~90px tab bar + safe area) while keeping normal padding on desktop.

