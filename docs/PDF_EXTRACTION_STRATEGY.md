# PDF Extraction Strategy - Complete Guide

## 🎯 Primary Goal

**Identify the courtroom first** - Once we have the courtroom, everything else follows from the database.

## 📋 Extraction Priority

```
1. Part Identifier → 2. Courtroom → 3. Judge + Clerk + All Details
```

## Step-by-Step Process

### Step 1: Extract Part Identifier (Column 1)

**From PDF:**
```
TAP A / TAP G / GWP1
OWN
OUT
10/23
10/24
```

**Extract:**
- `part_number`: "TAP A / TAP G / GWP1"
- `absence_status`: "OWN / OUT"
- `absence_dates`: ["10/23", "10/24"]

**DO NOT extract judge name** - it's not in the PDF!

### Step 2: Find Courtroom (Database Lookup)

**Query:**
```sql
SELECT room_number, room_id 
FROM court_rooms 
WHERE courtroom_number LIKE '%TAP A%' 
   OR courtroom_number LIKE '%GWP1%'
```

**Result:** Room 1100

### Step 3: Get All Details from Courtroom (Database Lookup)

**Query:**
```sql
SELECT justice, clerks, sergeant 
FROM court_assignments 
WHERE room_id = (SELECT room_id FROM court_rooms WHERE room_number = '1100')
```

**Result:**
- Judge: "Judge Lewis"
- Clerk: "A. CHAVARRIA"
- Sergeant: "Officer Smith"

## 📊 Column-by-Column Extraction

### Column 1: PART/JUDGE (Multi-line)
**Extract:**
- Part identifier (line 1)
- Status codes (OWN, OUT, etc.)
- Absence dates

**DO NOT extract:**
- Judge name (comes from database)

### Column 2: SENDING PART
**Values:**
- **"OWN"** → Case is from judge's own part (same courtroom)
- **Number** (e.g., "22") → Case sent from Part 22

**Extract as is** - no translation needed

### Column 3: DEFENDANT
**Extract:** Defendant name exactly as appears

### Column 4: PURPOSE
**Type:** **CODE**
**Examples:**
- BRG = Bail Review/Grand Jury
- ATT = Attempt
- ARR = Arraignment

**Extract:** Code as is (translation can happen later)

### Column 5: TRANSFER/START DATE
**Extract:** Date in whatever format appears
- "1019" → 10/19
- "10/19" → 10/19
- "10-19-25" → 10/19/25

### Column 6: TOP CHARGE
**Type:** **CODE**
**Examples:**
- "ATT" = Attempt
- "M1-687.1" = Misdemeanor 1st degree, section 687.1
- "CPW 1" = Criminal Possession of Weapon 1st degree

**Extract:** Code as is (translation can happen later)

### Column 7: STATUS
**Type:** **FREE TEXT**
**Extract:** Copy **EXACTLY AS IS**

Examples:
- "BRG CONT'D 10/23"
- "CALENDAR (2):"
- "JUDGE OUT 10/25-10/25"

**Do not modify, translate, or interpret**

### Column 8: ATTORNEY
**Extract:** Attorney name(s) exactly as appears

### Column 9: ESTIMATED FINAL DATE
**Extract:** Date in whatever format appears

## 🔑 Key Principles

### 1. Courtroom is King
```
Part → Courtroom → Everything Else
```
Once you have the courtroom, you can get:
- Judge name
- Clerk name
- Sergeant name
- Phone/Fax numbers
- Room location
- All assignment details

### 2. Codes vs Free Text

**CODES** (extract as is, translate later):
- Purpose (Column 4)
- Top Charge (Column 6)

**FREE TEXT** (copy exactly):
- Status (Column 7)
- Defendant (Column 3)
- Attorney (Column 8)

### 3. Special Values

**"OWN"** can appear in:
- Column 1 (status): Judge managing own calendar
- Column 2 (sending part): Case from judge's own part

Both mean "same courtroom/judge"

## 📝 Data Structure

### Extracted from PDF:
```typescript
{
  // Column 1
  part_number: "TAP A / TAP G / GWP1",
  absence_status: "OWN / OUT",
  absence_dates: ["10/23", "10/24"],
  
  // Columns 2-9 (per case)
  cases: [
    {
      sending_part: "OWN",           // Column 2
      defendant: "M. HREN (J)",      // Column 3
      purpose: "BRG",                // Column 4 - CODE
      transfer_date: "1019",         // Column 5
      top_charge: "ATT M1-687.1",    // Column 6 - CODE
      status: "BRG CONT'D 10/23",    // Column 7 - FREE TEXT
      attorney: "M. FELDMAN",        // Column 8
      estimated_final_date: "10/29"  // Column 9
    }
  ]
}
```

### Enriched from Database:
```typescript
{
  // From PDF
  part_number: "TAP A / TAP G / GWP1",
  absence_status: "OWN / OUT",
  absence_dates: ["10/23", "10/24"],
  
  // From Database (based on part → courtroom)
  room_number: "1100",
  judge_name: "Judge Lewis",
  clerk_name: "A. CHAVARRIA",
  sergeant_name: "Officer Smith",
  phone: "555-1234",
  fax: "555-5678",
  
  // Cases from PDF
  cases: [...]
}
```

## 🔍 Lookup Tables Needed

### 1. Part to Courtroom Mapping
```
court_rooms table:
- courtroom_number contains part identifier
- room_number is the actual room
```

### 2. Courtroom to Personnel Mapping
```
court_assignments table:
- Links room_id to justice, clerks, sergeant
```

### 3. Code Translation (Future Enhancement)
```
Purpose Codes:
- BRG → "Bail Review/Grand Jury"
- ATT → "Attempt"
- ARR → "Arraignment"

Charge Codes:
- M1 → "Misdemeanor 1st Degree"
- CPW → "Criminal Possession of Weapon"
```

## 🚀 Implementation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PDF UPLOAD                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. AI EXTRACTION                                             │
│    - Extract part identifier                                 │
│    - Extract absence info                                    │
│    - Extract all case columns (2-9)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PARSE PART COLUMN                                         │
│    parsePartJudgeColumn()                                    │
│    - part_number                                             │
│    - absence_status                                          │
│    - absence_dates                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. FIND COURTROOM                                            │
│    findRoomFromPart(part_number)                             │
│    Query: court_rooms WHERE courtroom_number LIKE part      │
│    Result: room_number                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GET PERSONNEL                                             │
│    getJudgeForRoom(room_number)                              │
│    getClerkForRoom(room_number)                              │
│    Query: court_assignments WHERE room_id = ...             │
│    Result: judge, clerk, sergeant                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. REVIEW & APPROVE                                          │
│    - User sees all extracted data                            │
│    - Courtroom, judge, clerk auto-filled                     │
│    - Can edit any field if needed                            │
│    - Codes shown as is (can be translated in UI)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. SAVE TO DATABASE                                          │
│    - Court session with all details                          │
│    - Cases with codes preserved                              │
│    - Links to courtroom and personnel                        │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Validation Rules

### Required Fields:
- ✅ Part number (from PDF)
- ✅ Courtroom (from database lookup)
- ✅ Judge (from database lookup)

### Optional Fields:
- Absence status
- Absence dates
- Clerk (should be auto-filled but can be empty)
- Cases (can be empty session)

### Data Quality Checks:
1. **Part → Courtroom**: If no match, flag for manual entry
2. **Courtroom → Judge**: If no assignment, flag for manual entry
3. **"OWN" in sending part**: Validate it matches the session's own part
4. **Dates**: Validate format (can be flexible)
5. **Status**: No validation - copy as is

## 🎨 UI Considerations

### Review Dialog Display:

| Part | Room | Judge | Status | Cases |
|------|------|-------|--------|-------|
| TAP A / TAP G / GWP1 | 1100 ✨ | Judge Lewis ✨ | 🔴 OWN / OUT | 5 |

✨ = Auto-filled from database

### Case Details (Expandable):

| Sending | Defendant | Purpose | Transfer | Charge | Status | Attorney | Est. Final |
|---------|-----------|---------|----------|--------|--------|----------|------------|
| OWN | M. HREN | BRG | 10/19 | ATT M1 | BRG CONT'D 10/23 | M. FELDMAN | 10/29 |

### Code Tooltips (Future):
- Hover over "BRG" → "Bail Review/Grand Jury"
- Hover over "ATT" → "Attempt"
- Hover over "M1" → "Misdemeanor 1st Degree"

## 📊 Success Metrics

### High Confidence (90%+):
- Part identifier extracted correctly
- Courtroom found in database
- Judge and clerk auto-filled
- All case columns extracted

### Medium Confidence (70-89%):
- Part identifier extracted
- Courtroom found
- Some case data missing

### Low Confidence (<70%):
- Part identifier unclear
- Courtroom not found
- Manual entry required

## 🔧 Error Handling

### Part Not Found in Database:
```
Action: Flag for manual courtroom entry
Message: "Courtroom not found for part 'TAP A / TAP G / GWP1'. Please select manually."
```

### No Judge Assignment:
```
Action: Flag for manual judge entry
Message: "No judge assigned to Room 1100. Please select manually."
```

### Ambiguous Part Match:
```
Action: Show multiple options
Message: "Multiple courtrooms found for 'TAP A'. Please select: Room 1100, Room 1200"
```

## 📚 Summary

**The Golden Rule:**
> Part → Courtroom → Everything Else

**Extract from PDF:**
- Part identifier
- Absence information
- All case columns (as is, no translation)

**Get from Database:**
- Courtroom number
- Judge name
- Clerk name
- All personnel details

**Preserve:**
- Codes as codes (Purpose, Top Charge)
- Free text as free text (Status)
- Special values (OWN)

**Result:**
- Complete, accurate court session data
- Minimal manual entry
- High confidence scores
- Ready for approval and save
