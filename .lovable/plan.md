
# Forms UI/UX Consistency Audit

## Executive Summary

After auditing 130+ form components across the application, I found significant inconsistencies in dialog wrappers, button placement, form validation patterns, and overall UX. These inconsistencies make the app feel disjointed - users have to relearn form behavior in each section of the app.

---

## Critical Findings

### 1. Five Different Dialog Wrapper Components (Chaos)

The codebase uses **5 different components** for form dialogs, each with different sizing, scrolling, and mobile behavior:

| Component | Files Using It | Sizing Approach | Mobile Behavior |
|-----------|----------------|-----------------|-----------------|
| `DialogContent` (raw) | 115+ files | Inconsistent `max-w-*` classes | No mobile optimization |
| `ModalFrame` | ~10 files | Standardized sizes (sm/md/lg/xl) | Basic responsive |
| `ResponsiveDialog` | ~8 files | `max-w-4xl` fixed | Drawer on mobile |
| `MobileOptimizedDialog` | ~5 files | Configurable maxWidth prop | Good mobile support |
| `MobileDetailsDialog` | ~3 files | Fixed `max-w-lg` | Good mobile support |

**Problem**: Users experience inconsistent dialog behavior. Some dialogs become drawers on mobile, others don't. Some scroll internally, others overflow. Sizing is unpredictable.

**Recommendation**: Standardize on `ModalFrame` as the primary wrapper with mobile-responsive enhancements.

---

### 2. Button Placement Inconsistencies

Discovered **three different patterns** for form button placement:

| Pattern | Gap | Position | Files |
|---------|-----|----------|-------|
| `flex justify-end gap-2` | 8px | Right-aligned | 30+ files |
| `flex justify-end gap-4` | 16px | Right-aligned | 15+ files |
| `DialogFooter` | Component default | Component standard | 60 files |
| Inline with content | Various | Mixed | ~20 files |

**Problem**: Button spacing varies between 8px and 16px. Some dialogs use `DialogFooter`, others manually create button rows. Order of Cancel/Submit buttons is inconsistent.

**Files needing standardization** (examples):
- `src/components/maintenance/ReportIssueDialog.tsx` - uses `gap-2`, no DialogFooter
- `src/components/ui/form-buttons.tsx` - uses `gap-4`
- `src/components/issues/form-sections/FormButtons.tsx` - uses `gap-2` with sticky positioning
- `src/components/tasks/CreateTaskDialog.tsx` - uses DialogFooter
- `src/components/court/QuickIssueDialog.tsx` - uses inline buttons with `gap-2`

---

### 3. Two Duplicate FormButtons Components

There are **two completely different** `FormButtons` components with incompatible APIs:

| Component | Location | Props |
|-----------|----------|-------|
| `FormButtons` | `src/components/ui/form-buttons.tsx` | `onCancel`, `isSubmitting`, `submitLabel`, `cancelLabel` |
| `FormButtons` | `src/components/issues/form-sections/FormButtons.tsx` | `onClose`, `updateIssueMutation` (expects mutation object) |

**Problem**: Developers don't know which to use. The issues version is tightly coupled to mutation objects instead of a simple `isSubmitting` boolean.

**Recommendation**: Delete the issues-specific version and use the generic one, or merge into a single unified component.

---

### 4. Form Validation Approach Inconsistencies

Three different form patterns coexist:

| Pattern | Example File | Usage |
|---------|--------------|-------|
| **react-hook-form + Zod** | `CreateTaskDialog.tsx`, `EditIssueForm.tsx` | Modern, validated |
| **useState + manual validation** | `ReportIssueDialog.tsx`, `QuickIssueDialog.tsx` | No schema validation |
| **Hybrid (both)** | Some room forms | Confusing mix |

**Problem**: The maintenance `ReportIssueDialog.tsx` uses raw `useState` for form data while `CreateTaskDialog.tsx` (similar complexity) uses proper react-hook-form. This creates:
- Inconsistent error display
- No field-level validation feedback
- Different submission patterns

---

### 5. Specific Dialog Sizing Chaos

Sampling of actual `max-w-*` values found across dialogs:

```text
max-w-lg        - 21 files (512px)
max-w-2xl       - 18 files (672px)  
max-w-3xl       - 12 files (768px)
max-w-4xl       - 8 files (896px)
max-w-xl        - 7 files (576px)
max-w-md        - 6 files (448px)
max-w-6xl       - 2 files (1152px)
sm:max-w-[425px] - 5 files (custom)
sm:max-w-[500px] - 3 files (custom)
sm:max-w-[600px] - 2 files (custom)
```

**Problem**: No consistent sizing strategy. Similar forms have wildly different widths.

---

### 6. Label/Input Patterns

Two patterns found for form field labeling:

| Pattern | Usage | Accessibility |
|---------|-------|---------------|
| `<Label htmlFor="x"><Input id="x">` | 91 files | Manual linking |
| `<FormLabel>` + `<FormControl>` | 130 files | Auto-linked via context |

The second pattern (shadcn/ui Form components) is preferred but not universally used.

---

## Recommended Standardization

### Standard Dialog Pattern
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <ModalFrame title="Form Title" description="Optional description" size="md">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields using FormField, FormItem, FormLabel, FormControl, FormMessage */}
        
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </ModalFrame>
</Dialog>
```

### Standard Modal Sizes
| Size | Max Width | Use Case |
|------|-----------|----------|
| `sm` | 480px | Confirmations, simple inputs |
| `md` | 700px | Standard forms (default) |
| `lg` | 840px | Complex forms with tabs |
| `xl` | 1024px | Wizards, data-heavy forms |

---

## Implementation Plan

### Phase 1: Foundation (Immediate)

1. **Enhance ModalFrame** - Add mobile drawer behavior from ResponsiveDialog
2. **Create unified FormButtons** - Merge the two versions into `src/components/ui/form-buttons.tsx`
3. **Create FormFooter wrapper** - Standardize sticky footer with border-t pattern

**Files to modify:**
- `src/components/common/ModalFrame.tsx` - Add mobile drawer support
- `src/components/ui/form-buttons.tsx` - Enhance with loading state display
- Delete or deprecate: `src/components/issues/form-sections/FormButtons.tsx`

### Phase 2: High-Priority Form Fixes

Migrate these **most-used forms** to the standard pattern:

| Form | Current Issues | Priority |
|------|---------------|----------|
| `ReportIssueDialog.tsx` | useState, no DialogFooter, gap-2 | High |
| `QuickIssueDialog.tsx` | useState, inline buttons | High |
| `EditKeyDialog.tsx` | AlertDialog for submit (confusing), raw Dialog | High |
| `CreateKeyForm.tsx` | Correct pattern, can be template | Reference |
| `ScheduleMaintenanceDialog.tsx` | Manual buttons, gap-2 | Medium |

### Phase 3: Bulk Migration

Systematic migration of remaining forms using search/replace patterns:

1. Replace `DialogContent className="max-w-*"` with `ModalFrame size="*"`
2. Replace manual button divs with `DialogFooter`
3. Standardize gap to `gap-2` (the Radix default)
4. Convert useState forms to react-hook-form where practical

---

## Files to Change

### Critical (Phase 1)

| File | Change |
|------|--------|
| `src/components/common/ModalFrame.tsx` | Add mobile drawer behavior |
| `src/components/ui/form-buttons.tsx` | Keep and enhance |
| `src/components/issues/form-sections/FormButtons.tsx` | Deprecate, update EditIssueForm to use generic |

### High Priority (Phase 2)

| File | Change |
|------|--------|
| `src/components/maintenance/ReportIssueDialog.tsx` | Convert to react-hook-form, use ModalFrame |
| `src/components/court/QuickIssueDialog.tsx` | Convert to react-hook-form, use ModalFrame |
| `src/components/keys/EditKeyDialog.tsx` | Remove AlertDialog nesting, use standard submit |
| `src/components/tasks/RequestTaskDialog.tsx` | Already good, minor footer standardization |

### Medium Priority (Phase 3 - batch)

Forms using raw DialogContent that need ModalFrame:
- `src/components/inventory/EditItemDialog.tsx`
- `src/components/inventory/CreateItemDialog.tsx`
- `src/components/court-operations/CoverageAssignmentDialog.tsx`
- `src/components/forms/FormPreviewDialog.tsx`
- `src/components/forms/FormTemplateBuilderDialog.tsx`
- ~100+ other dialog files

---

## Expected Outcomes

After implementation:

1. **Consistent sizing** - All dialogs use 4 standard sizes
2. **Mobile-friendly** - All forms work as drawers on mobile devices
3. **Predictable buttons** - Cancel left, Submit right, consistent gap
4. **Proper validation** - All forms use react-hook-form + Zod
5. **Single source of truth** - One FormButtons, one ModalFrame pattern
6. **Reduced cognitive load** - Users know how forms behave everywhere

---

## Technical Notes

### Dialog Wrapper Decision

Use `ModalFrame` enhanced with mobile drawer behavior rather than `ResponsiveDialog` because:
- ModalFrame already has standardized sizing
- ModalFrame supports headerRight slot
- ModalFrame has proper padding/scrolling
- Adding drawer behavior is straightforward

### Button Order

Standard order (following macOS/Windows conventions):
- Cancel (left, outline variant)
- Primary action (right, default variant)

This matches the existing pattern in 80% of forms.

### Form Validation

For new forms, always use:
```tsx
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {...}
});
```

Never use raw useState for form data except for very simple single-field forms.
