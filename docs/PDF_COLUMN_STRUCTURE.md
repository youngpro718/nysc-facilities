# Court Daily Report PDF - Column Structure

## Actual PDF Structure (from 100C AM PM REPORT)

Based on the actual court report PDF, here's the complete column structure:

### Column 1: PART/JUDGE (Multi-line)
```
PART 3 - TAPIA
Cal Wk 3
OUT
10/21-10/25
10/24
```

**Parsed Fields:**
- `part_number`: "3"
- `judge_name`: "TAPIA"
- `calendar_week`: "3"
- `absence_status`: "OUT"
- `absence_dates`: ["10/21-10/25", "10/24"]

### Column 2: PAPERS IN
```
OWN
```

### Column 3: DISPOSITION
```
M. HREN (J)
7943-24
```

### Column 4: DEMO
```
BRG
```

### Column 5: IND
```
1019
```

### Column 6: TOP CHARGE
```
ATT
M1-687.1
```

### Column 7: STATUS
```
BRG CONT'D 10/23
CALENDAR (2):
CALENDAR 10/23-10
JUDGE OUT 10/25-10/25
```

### Column 8: ATTORNEYS
```
M. FELDMAN
ADA BARBOUR
```

### Column 9: EST. FINAL
```
10/29
11
```

## Parsing Strategy

### Multi-line First Column
The first column contains multiple pieces of information stacked vertically:

1. **Line 1**: Part number and judge name
   - Pattern: `PART \d+ - NAME` or `PART \d+ NAME`
   - Example: "PART 3 - TAPIA" → part: 3, judge: TAPIA

2. **Line 2**: Calendar week
   - Pattern: `Cal Wk \d+` or `CALENDAR (2):`
   - Example: "Cal Wk 3" → calendar_week: 3

3. **Line 3**: Absence status
   - Values: "OUT", "OWN", or other short codes
   - Example: "OUT" → absence_status: OUT

4. **Lines 4+**: Absence dates
   - Pattern: Date ranges or specific dates
   - Example: "10/21-10/25" → absence_dates: ["10/21-10/25", "10/24"]

### Case Details (Columns 2-9)
Each row under a part represents a case with:
- **Sending Part** (Papers In)
- **Defendant** (Disposition)
- **Purpose** (Demo)
- **Transfer Date** (Ind)
- **Top Charge** (Top Charge)
- **Status** (Status)
- **Attorney** (Attorneys)
- **Estimated Final** (Est. Final)

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
