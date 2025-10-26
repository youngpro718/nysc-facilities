# Court Daily Report PDF - Column Structure

## Actual PDF Structure (from 100C AM PM REPORT)

Based on the actual court report PDF, here's the complete column structure:

### Column 1: PART/JUDGE (Multi-line)
```
TAP A / TAP G / GWP1
OWN
OUT
10/23
10/24
```

**Parsed Fields:**
- `part_number`: "TAP A / TAP G / GWP1"
- `absence_status`: "OWN / OUT"
- `absence_dates`: ["10/23", "10/24"]

**NOT in PDF (comes from database):**
- `judge_name`: "Judge Lewis" ← From court_assignments based on part
- `room_number`: "1100" ← From court_rooms based on part

### Column 2: SENDING PART
```
OWN
```
**or**
```
22
```

**Meaning:**
- **OWN**: Judge's own part (same courtroom)
- **Number**: Part number sending the case to this courtroom

### Column 3: DEFENDANT (Disposition)
```
M. HREN (J)
7943-24
```

### Column 4: PURPOSE (Demo)
```
BRG
```
**Note:** This is a **code** (e.g., BRG = Bail Review/Grand Jury)

### Column 5: TRANSFER/START DATE (Ind)
```
1019
```
**Note:** Date format (e.g., 10/19 or 1019)

### Column 6: TOP CHARGE
```
ATT
M1-687.1
```
**Note:** These are **codes** for charges (e.g., ATT = Attempt, M1 = Misdemeanor 1st degree)

### Column 7: STATUS
```
BRG CONT'D 10/23
CALENDAR (2):
CALENDAR 10/23-10
JUDGE OUT 10/25-10/25
```
**Note:** Copy **as is** - free text status information

### Column 8: ATTORNEY
```
M. FELDMAN
ADA BARBOUR
```
**Note:** Defense attorney name(s)

### Column 9: ESTIMATED FINAL DATE
```
10/29
11
```
**Note:** Expected completion date

## Parsing Strategy

### Multi-line First Column
The first column contains multiple pieces of information stacked vertically:

1. **Line 1**: Part identifier (NOT judge name!)
   - Pattern: Part code/identifier (can be complex like "TAP A / TAP G / GWP1")
   - Example: "TAP A / TAP G / GWP1" → part_number: "TAP A / TAP G / GWP1"
   - **Judge name comes from database**, not from PDF!

2. **Remaining Lines**: Status codes and dates (order varies)
   - **Status codes**: "OUT", "OWN", etc.
   - **Calendar week**: "Cal Wk 3" (if present)
   - **Dates**: "10/23", "10/24", "10/21-10/25", etc.
   
3. **Example parsing**:
   ```
   TAP A / TAP G / GWP1  → part_number
   OWN                    → status code
   OUT                    → status code
   10/23                  → absence date
   10/24                  → absence date
   ```
   
   Result:
   - part_number: "TAP A / TAP G / GWP1"
   - absence_status: "OWN / OUT"
   - absence_dates: ["10/23", "10/24"]

### Case Details (Columns 2-9)
Each row under a part represents a case with:

| Column | Field | Type | Notes |
|--------|-------|------|-------|
| 2 | Sending Part | Text/Code | "OWN" or part number |
| 3 | Defendant | Text | Defendant name |
| 4 | Purpose | **CODE** | BRG, ATT, etc. |
| 5 | Transfer Date | Date | Format varies |
| 6 | Top Charge | **CODE** | ATT, M1-687.1, etc. |
| 7 | Status | **FREE TEXT** | Copy as is |
| 8 | Attorney | Text | Defense attorney |
| 9 | Est. Final | Date | Completion date |

**Important:**
- **Codes** (Purpose, Top Charge): Need lookup/translation
- **Free Text** (Status): Copy exactly as appears
- **OWN** (Sending Part): Means same courtroom

## Implementation

### Parser Function
```typescript
parsePartJudgeColumn(columnText: string): {
  part_number: string;
  judge_name: string;
  calendar_week?: string;
  absence_status?: string;
  absence_dates?: string[];
}
```

### Usage in Extraction
```typescript
const partJudgeData = parsePartJudgeColumn(rawColumn);
// {
//   part_number: "3",
//   judge_name: "TAPIA",
//   calendar_week: "3",
//   absence_status: "OUT",
//   absence_dates: ["10/21-10/25", "10/24"]
// }
```

### Enrichment with Database
```typescript
const enriched = await enrichSessionData([partJudgeData], '100');
// {
//   part_number: "3",
//   judge_name: "Hon. Tapia",        // ← Normalized
//   calendar_week: "3",
//   absence_status: "OUT",
//   absence_dates: ["10/21-10/25", "10/24"],
//   room_number: "1200",             // ← Auto-filled
//   clerk_name: "A. CHAVARRIA"       // ← Auto-filled
// }
```

## Visual Representation

```
┌─────────────────┬──────────┬─────────────┬──────┬─────┬───────────┬─────────────┬───────────┬──────────┐
│ PART/JUDGE      │ PAPERS   │ DISPOSITION │ DEMO │ IND │ TOP       │ STATUS      │ ATTORNEYS │ EST.     │
│                 │ IN       │             │      │     │ CHARGE    │             │           │ FINAL    │
├─────────────────┼──────────┼─────────────┼──────┼─────┼───────────┼─────────────┼───────────┼──────────┤
│ PART 3 - TAPIA  │ OWN      │ M. HREN (J) │ BRG  │ 1019│ ATT       │ BRG CONT'D  │ M. FELDMAN│ 10/29    │
│ Cal Wk 3        │          │ 7943-24     │      │     │ M1-687.1  │ 10/23       │ ADA       │ 11       │
│ OUT             │          │             │      │     │           │ CALENDAR(2):│ BARBOUR   │          │
│ 10/21-10/25     │          │             │      │     │           │ CAL 10/23-10│           │          │
│ 10/24           │          │             │      │     │           │ JUDGE OUT   │           │          │
│                 │          │             │      │     │           │ 10/25-10/25 │           │          │
└─────────────────┴──────────┴─────────────┴──────┴─────┴───────────┴─────────────┴───────────┴──────────┘
```

## Data Flow

```
PDF Upload
    ↓
AI Extraction
    ↓
Parse Multi-line Column
    ├─ Extract part number
    ├─ Extract judge name
    ├─ Extract calendar week
    ├─ Extract absence status
    └─ Extract absence dates
    ↓
Database Enrichment
    ├─ Normalize judge name
    ├─ Find room from part
    └─ Assign clerk
    ↓
Review & Approve
```

## Benefits

### Automatic Extraction
- ✅ Part number and judge name
- ✅ Calendar week information
- ✅ Absence status tracking
- ✅ Multiple absence dates

### Database Enhancement
- ✅ Room number auto-filled
- ✅ Clerk name auto-filled
- ✅ Judge name normalized

### User Experience
- ✅ Less manual data entry
- ✅ Visual absence indicators
- ✅ Complete calendar information
- ✅ Higher confidence scores

## Example Cases

### Case 1: Judge Present
```
PART 22 - STATZINGER
Cal Wk 3
```
**Result**: No absence status, judge available

### Case 2: Judge Out
```
PART 3 - TAPIA
Cal Wk 3
OUT
10/21-10/25
10/24
```
**Result**: Judge out on specified dates, shown with red badge

### Case 3: Own Calendar
```
PART 8 - LEBOVITS
Cal Wk 3
OWN
```
**Result**: Judge managing own calendar, shown with gray badge

## Testing Scenarios

1. **Single absence date**
   ```
   PART 5 - JUDGE
   Cal Wk 2
   OUT
   10/23
   ```

2. **Multiple absence dates**
   ```
   PART 5 - JUDGE
   Cal Wk 2
   OUT
   10/23-10/25
   10/27
   ```

3. **No absence**
   ```
   PART 5 - JUDGE
   Cal Wk 2
   ```

4. **Different status**
   ```
   PART 5 - JUDGE
   Cal Wk 2
   OWN
   ```
