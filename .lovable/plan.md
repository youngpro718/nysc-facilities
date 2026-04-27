## Goal
Replace the 10 generic fallback images in `src/assets/inventory/` with a cohesive set of **modern flat illustrated icons** that look intentionally designed (not stocky JPEGs). These show whenever an inventory item has no `photo_url`, used across:

- Supply ordering (`SupplyItemCard`, `InlineItemRow`)
- Inventory panels (`InventoryItemsPanel`, `InventoryTable`)
- Mobile inventory grid (`MobileInventoryGrid`)

## Visual direction
A unified illustration system so all 10 images feel like one set:

- **Background**: soft tinted square (subtle category color tint over `--background`-ish neutral), rounded composition, no photo noise
- **Subject**: clean vector-style flat illustration with 2–3 muted brand-aligned tones, soft drop shadow, slight depth via flat highlights
- **Composition**: centered, generous padding, 1:1 aspect, framed so it crops gracefully in both square (`SupplyItemCard`) and wide list rows
- **Palette**: aligned with the app's existing semantic tokens (deep navy/slate primary, warm accents) so they don't clash with the dashboard chrome
- **Format**: 1024×1024 PNG (then we let the browser/`object-cover` handle scaling); kept under ~150 KB each

Per category, the subject:
1. **paper** — stack of paper + printer ream
2. **cleaning** — spray bottle + sponge
3. **lighting** — LED bulb with soft glow
4. **furniture** — office chair + small desk
5. **stationery** — pen, pencil, paperclip cluster
6. **tools** — wrench crossed with screwdriver
7. **safety** — hard hat + safety vest
8. **bathroom** — toilet paper roll + dispenser
9. **electronics** — USB cable coil + power adapter
10. **default** — generic cardboard supply box

## Implementation
1. **Generate the 10 PNGs** using the AI Gateway (`google/gemini-3-pro-image-preview` for higher quality), each with a tightly written prompt enforcing:
   - "flat vector illustration, single centered subject, soft pastel background, muted navy/slate palette with one warm accent, no text, no logos, no shadow background, 1:1"
   - explicit subject per category
2. **QA pass**: open each generated image, check for: text artifacts, wrong subject, off-palette images, broken composition. Regenerate any that fail.
3. **Optimize**: convert/compress to keep each ≤150 KB while preserving sharpness.
4. **Replace files in place**: overwrite the existing `src/assets/inventory/{paper,cleaning,lighting,furniture,stationery,tools,safety,bathroom,electronics,default}.jpg` with the new versions (keeping `.jpg` filenames so no import paths in `src/utils/inventoryImages.ts` or any consumer change).
5. **Verify in app** by viewing the inventory & supply order pages — fallback images should now look like a designed icon set.

## Files touched
- Replaced: `src/assets/inventory/*.jpg` (all 10 files, same filenames)
- No code changes required — `src/utils/inventoryImages.ts` keyword mapping stays identical

## Out of scope (can do as a follow-up)
- Adding new categories (beverage, IT, badges) — current keyword map stays the same
- Switching to SVG (would touch every consumer & Vite import) — staying with raster keeps this a zero-code change
- Per-item photo upload UX (already exists via `ItemPhotoUpload`)