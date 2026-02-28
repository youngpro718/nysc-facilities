

## Three Fixes

### 1. Admin Center button does nothing

**Root cause:** Same index-offset bug as before. The admin nav tabs include a `{ type: "separator" }` at index 9, but the routes array has no corresponding empty string entry. So "Admin Center" (index 10) maps to `routes[10]` which is `undefined`.

**Fix in `src/components/layout/config/navigation.tsx`:** Add `''` for the separator between `/court-operations` and `/admin`:

```
'/court-operations',
'',          // ← separator placeholder
'/admin',
```

### 2. Logo too small

**Fix in `src/components/layout/components/AppSidebar.tsx`:** Change the logo container from `h-8 w-8` to `h-10 w-10` in both collapsed and expanded states (3 occurrences around lines 46, 51, 55).

### 3. Card flip animation is janky

**Root cause in `src/components/spaces/rooms/RoomCard.tsx`:** Line 79 uses `transition-all` which transitions every CSS property (shadows, opacity, etc.) along with the transform, causing visual artifacts during the flip.

**Fix:** Change `transition-all` to `transition-transform` on line 79 so only the 3D rotation animates smoothly.

