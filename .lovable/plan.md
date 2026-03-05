

## Fix: App Content Cut Off on iOS Mobile

### Changes

**1. Clean up `src/App.css`** — Remove Vite boilerplate that constrains layout (`max-width: 1280px`, `padding: 2rem`, `text-align: center`). Replace with minimal full-height rule:
```css
#root {
  min-height: 100dvh;
}
```

**2. `src/components/layout/Layout.tsx` (line 222)** — Increase bottom padding on `<main>` to clear the tab bar + safe area + FAB. Change from `pb-20` to `pb-28` and add inline style for iOS safe-area fallback:
```html
<main className="flex-1 pb-28 md:pb-0 safe-area-bottom"
      style={{ paddingBottom: 'max(7rem, calc(env(safe-area-inset-bottom) + 5rem))' }}>
```
This ensures at minimum 112px clearance (enough for tab bar + FAB), plus safe area inset on notched iPhones.

