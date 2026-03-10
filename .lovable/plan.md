

# Streamline Issue Reporting & Photo Capture UX

## Current Problems

1. **Issue Wizard has unnecessary friction**: Two separate steps with a "Next" button between them. Step 1 crams room selection + category. Users must tap Next before they can describe or photograph the issue.

2. **Photo capture is buried**: The camera/photo button is at the bottom of step 2, easy to miss. On mobile, users want to snap a photo first — that's the fastest way to report.

3. **Room photo upload is over-engineered**: `MobilePhotoUpload` is 470 lines with sessionStorage persistence, orientation change handlers, and abort controllers — all unnecessary complexity for a simple photo upload. It also doesn't support `capture="environment"` for direct camera access.

4. **Inconsistent photo components**: Three different photo upload UIs across the app (issue wizard inline, `IssuePhotoForm`, `MobilePhotoUpload`, `GeneralRoomPhotoUpload`) with different patterns.

## Plan

### 1. Redesign Issue Wizard as Single-Screen Form
**File:** `src/components/issues/wizard/SimpleReportWizard.tsx`

Replace the 2-step wizard with a single scrollable screen:
- **Top**: Camera-first CTA — large "Take a Photo" button with camera icon (most useful info, fastest action)
- **Below photos**: Category chips in a horizontal scrollable row (not a 2x3 grid) — tap one to select
- **Room**: Auto-selected as before, shown as a compact badge (not a radio group taking half the screen). Tap to change via a bottom sheet.
- **Description**: Textarea with mic button, always visible
- **Submit**: Sticky bottom button

This eliminates the "Next" step entirely. Users can fill fields in any order and submit when ready.

### 2. Create Unified Photo Capture Component
**New file:** `src/components/common/PhotoCapture.tsx`

A single, clean photo component (~80 lines) used everywhere:
- Large touch-friendly capture button (44px+) with `capture="environment"` for mobile camera
- Horizontal thumbnail strip with swipe-to-delete
- Client-side image compression before upload (reduce upload time)
- Simple props: `bucket`, `maxPhotos`, `photos`, `onPhotosChange`
- No sessionStorage, no orientation handlers, no abort controllers

### 3. Simplify Room Photo Upload
**Files:** `src/components/spaces/forms/room/wizard/steps/PhotosStep.tsx`, `src/components/spaces/forms/room/GeneralRoomPhotoUpload.tsx`

- Replace `MobilePhotoUpload` usage in `CourtroomPhotoUpload` with the new `PhotoCapture` component
- Simplify `GeneralRoomPhotoUpload` to use `PhotoCapture` instead of its own upload logic
- Add `capture="environment"` to all file inputs for direct camera on mobile
- Remove the caption input (rarely used, adds friction)

### 4. Streamline Edit Issue Photo Tab
**File:** `src/components/issues/wizard/IssuePhotoForm.tsx`

- Replace the large dashed upload zone with the new `PhotoCapture` component
- Consistent look with the issue wizard

### 5. Mobile Touch Optimizations
- All photo-related buttons: `min-h-[44px]` touch targets
- Photo delete buttons: always visible on mobile (not hover-only)
- Category chips: `touch-manipulation` and `active:scale-[0.97]` for tactile feedback

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/common/PhotoCapture.tsx` | **Create** — unified photo component |
| `src/components/issues/wizard/SimpleReportWizard.tsx` | **Rewrite** — single-screen form |
| `src/components/issues/wizard/IssuePhotoForm.tsx` | **Simplify** — use PhotoCapture |
| `src/components/spaces/forms/room/CourtroomPhotoUpload.tsx` | **Simplify** — use PhotoCapture |
| `src/components/spaces/forms/room/wizard/GeneralRoomPhotoUpload.tsx` | **Simplify** — use PhotoCapture |

