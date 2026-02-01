

# Simplified User Issue Reporting Flow

## Current State Analysis

### What Exists Now (4-Step Flow)
The current `ReportIssueWizard.tsx` has 4 mandatory steps:

| Step | Fields | Taps Required |
|------|--------|---------------|
| 1. Type | Select from 7 categories | 2 taps (select + next) |
| 2. Location | Select room (or use assigned) | 2 taps (select + next) |
| 3. Contact | Name*, Phone, Department + toggle | 2+ taps (verify/edit + next) |
| 4. Details | Problem Type dropdown, Description*, Emergency toggle, Photos | 3+ taps (fill + submit) |

**Total: 8-10+ taps minimum**

### Problems Identified
1. **Step 3 (Contact) is redundant** - data already auto-populated from profile via `useAuth()`
2. **7 categories cause decision fatigue** - too many similar options
3. **Problem Type dropdown adds friction** - secondary categorization after already selecting type
4. **Emergency toggle rarely used** - clutters the interface
5. **Photo upload shown to regular users** - you mentioned they don't need it

---

## Proposed 2-Step Flow

### Step 1: Room + Issue Type (Combined)
One screen with:
- **Your assigned room(s)** at top (one-tap selection)
- **"Report for different room" toggle** (expands room picker if needed)
- **5 issue categories** as large tap targets

### Step 2: Description + Submit
One screen with:
- **Description textarea** with voice dictation (already exists)
- **Submit button**
- No photos, no emergency toggle, no problem type sub-categories

**Total: 3-4 taps** (room + type + description + submit)

---

## Implementation Details

### Step 1: Combined Location + Type

```text
┌──────────────────────────────────────────────────────────────┐
│  What's the issue?                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  YOUR ROOM                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [✓] Courtroom 1616 • Floor 16                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ ] Report for a different room                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ISSUE TYPE                                                  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │     ⚡      │  │     🔧      │  │     ❄️      │          │
│  │ Electrical  │  │  Plumbing   │  │   Climate   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                            │
│  │     🧹      │  │     💬      │                            │
│  │  Cleaning   │  │   Other     │                            │
│  └─────────────┘  └─────────────┘                            │
│                                                              │
│                                          [Next →]            │
└──────────────────────────────────────────────────────────────┘
```

### Step 2: Description + Submit

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Back        Describe the issue                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📍 Courtroom 1616 • ⚡ Electrical                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┬───┐  │
│  │                                                    │ 🎤│  │
│  │  What's the problem? Tap the mic to dictate...    │   │  │
│  │                                                    │   │  │
│  │                                                    │   │  │
│  └────────────────────────────────────────────────────┴───┘  │
│                                                              │
│                                                              │
│                        [Submit Report]                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Category Simplification

### Before (7 categories)
- ACCESS_REQUEST
- BUILDING_SYSTEMS  
- CLEANING_REQUEST
- CLIMATE_CONTROL
- ELECTRICAL_NEEDS
- GENERAL_REQUESTS
- PLUMBING_NEEDS

### After (5 categories)
| New Category | Maps To | Description |
|--------------|---------|-------------|
| **Electrical** | ELECTRICAL_NEEDS | Lights, outlets, power |
| **Plumbing** | PLUMBING_NEEDS | Leaks, clogs, water |
| **Climate** | CLIMATE_CONTROL | Temperature, AC, heat |
| **Cleaning** | CLEANING_REQUEST | Spills, trash, cleaning |
| **Other** | GENERAL_REQUESTS | Everything else (access, safety, etc.) |

We keep the backend types unchanged - just consolidate the user-facing options.

---

## What Gets Removed for Regular Users

| Feature | Kept? | Reason |
|---------|-------|--------|
| Problem Type dropdown | No | Redundant sub-categorization |
| Contact step | No | Auto-populated from profile |
| Emergency toggle | No | Rarely used, can be added by admin |
| Photo upload | No | Per your feedback - not needed |
| 7 categories | No | Simplified to 5 |

---

## Files to Modify

### 1. Create: `src/components/issues/wizard/SimpleReportWizard.tsx`
New simplified 2-step wizard for regular users:
- Step 1: Room selection + 5 issue type buttons
- Step 2: Description with voice dictation + submit
- Reuses existing hooks and mutations

### 2. Create: `src/components/issues/wizard/constants/simpleCategories.ts`  
Simplified 5-category mapping for regular users

### 3. Modify: `src/components/issues/IssueDialog.tsx`
Conditional logic to show:
- `SimpleReportWizard` for regular users (court clerks, aides)
- `ReportIssueWizard` for users without assigned rooms (fallback)

### 4. Keep Unchanged: `src/components/issues/wizard/ReportIssueWizard.tsx`
Preserved as fallback for edge cases

---

## User Experience Comparison

| Metric | Current | Proposed |
|--------|---------|----------|
| Steps | 4 | 2 |
| Minimum taps | 8-10 | 3-4 |
| Categories to choose from | 7 | 5 |
| Form fields to fill | 5+ | 1 (description) |
| Time to submit | ~45 seconds | ~15 seconds |

---

## Technical Notes

- **Voice dictation preserved**: The existing `DescriptionField` component with speech recognition is reused
- **Contact info auto-captured**: The `created_by` field links to the user's profile - no need to collect name/phone
- **Assigned rooms**: Uses existing `assignedRooms` prop from `UserAssignment[]`
- **Database compatibility**: Still creates issues with the same schema, just fewer fields filled

