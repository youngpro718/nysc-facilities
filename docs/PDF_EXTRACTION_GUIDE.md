# PDF Extraction Enhancement Guide

## Overview
The PDF extraction system has been enhanced to automatically fill in court session data using information already available in the application's database.

## Column Breakdown & Data Sources

### 1. **Part/Judge Column**
**Contains:** Part number, judge name, calendar week, absence status, absence dates

**Structure in PDF:**
```
PART 3 - TAPIA
Cal Wk 3
OUT
10/21-10/25
10/24
```

**Data Sources:**
- **Part Number**: Extracted from PDF (e.g., "3")
- **Judge Name**: 
  - Primary: Extracted from PDF (e.g., "TAPIA")
  - Enhanced: Matched against `personnel_profiles` table (judges/justices)
  - Normalized to use official names from database
- **Calendar Week**: Extracted from PDF (e.g., "Cal Wk 3")
- **Absence Status**: Extracted from PDF (e.g., "OUT", "OWN")
- **Absence Dates**: Extracted from PDF (e.g., "10/21-10/25", "10/24")

**Parsing Logic:**
```typescript
// Parse multi-line first column
Line 1: "PART 3 - TAPIA" → part_number: "3", judge_name: "TAPIA"
Line 2: "Cal Wk 3" → calendar_week: "3"
Line 3: "OUT" → absence_status: "OUT"
Line 4+: "10/21-10/25" → absence_dates: ["10/21-10/25", "10/24"]
```

**Enrichment Logic:**
```typescript
// Finds best matching judge from database
findJudgeName("TAPIA") → "Hon. Tapia" from personnel_profiles
```

### 2. **Sending Part**
**Contains:** Which part is sending the case

**Data Sources:**
- Extracted from PDF case details
- Stored in `cases` array for each session

### 3. **Defendant**
**Contains:** Defendant name

**Data Sources:**
- Extracted from PDF case details
- Multiple defendants aggregated with semicolon separator

### 4. **Purpose**
**Contains:** Purpose of court appearance

**Data Sources:**
- Extracted from PDF case details
- Unique purposes aggregated with semicolon separator

### 5. **Transfer/Start Date**
**Contains:** When case was transferred or started

**Data Sources:**
- Extracted from PDF case details
- Unique dates aggregated with semicolon separator

### 6. **Top Charge**
**Contains:** Primary charge

**Data Sources:**
- Extracted from PDF case details
- All charges listed with semicolon separator

### 7. **Status**
**Contains:** Case status

**Data Sources:**
- Extracted from PDF case details
- Unique statuses aggregated with semicolon separator

### 8. **Attorney**
**Contains:** Defense attorney name

**Data Sources:**
- Extracted from PDF case details
- Unique attorneys aggregated with semicolon separator

### 9. **Estimated Final Date**
**Contains:** Expected completion date

**Data Sources:**
- Extracted from PDF case details
- Unique dates aggregated with semicolon separator

## Auto-Populated Fields

### Room Number
**NOT in PDF, AUTO-POPULATED from database**

**Data Sources (in priority order):**
1. **Part-to-Room Mapping** (`court_rooms` table)
   - Maps part numbers to room numbers
   - Example: Part 22 → Room 1417
   
2. **Judge-to-Room Mapping** (`court_assignments` table)
   - Maps judges to their assigned rooms
   - Fallback if part mapping not found

**Enrichment Logic:**
```typescript
// Try part number first
findRoomFromPart("22") → "1417"

// Fallback to judge name
findRoomFromJudge("Statzinger") → "1417"
```

### Clerk Name
**NOT in PDF, AUTO-POPULATED from database**

**Data Sources:**
1. **Court Assignments** (`court_assignments` table)
   - Gets clerk assigned to the room
   - Uses room_id to find assignment
   
2. **Personnel Profiles** (`personnel_profiles` table)
   - Validates clerk names
   - Normalizes to official names

**Enrichment Logic:**
```typescript
// Get clerk for specific room
getClerkForRoom("1417") → Clerk name from court_assignments
```

## Database Tables Used

### 1. `court_rooms`
```sql
SELECT id, room_id, room_number, courtroom_number, is_active
FROM court_rooms
ORDER BY room_number
```
**Purpose:** Maps parts to rooms, provides room metadata

### 2. `court_assignments`
```sql
SELECT id, room_id, justice, clerks, sergeant
FROM court_assignments
```
**Purpose:** Current assignments of judges, clerks, sergeants to rooms

### 3. `personnel_profiles`
```sql
SELECT id, display_name, full_name, primary_role, title, department
FROM personnel_profiles
WHERE is_active = true
```
**Purpose:** Official names and roles of all court personnel

## Enrichment Process Flow

```
1. PDF Upload
   ↓
2. AI Extraction (parse-pdf function)
   ↓
3. Session Creation
   - Part number
   - Judge name (raw from PDF)
   - Case details
   ↓
4. Database Enrichment ← NEW STEP
   ↓
   4a. Load Enrichment Data
       - Court rooms
       - Personnel profiles
       - Court assignments
   ↓
   4b. Enrich Each Session
       - Normalize judge name
       - Find room number (part → room OR judge → room)
       - Find clerk name (room → clerk)
       - Increase confidence score
   ↓
5. Review Dialog
   - User can edit any field
   - Auto-populated fields shown
   ↓
6. Approve & Save
```

## Implementation Files

### Core Service
**File:** `/src/services/court/pdfEnrichmentService.ts`

**Key Functions:**
- `loadEnrichmentData(buildingCode)` - Loads all database data
- `findRoomFromPart(partNumber)` - Maps part to room
- `findRoomFromJudge(judgeName)` - Maps judge to room
- `findJudgeName(extractedName)` - Normalizes judge name
- `getClerkForRoom(roomNumber)` - Gets clerk for room
- `enrichSessionData(sessions, buildingCode)` - Main enrichment function

### UI Components
**File:** `/src/components/court-operations/UploadDailyReportDialog.tsx`
- Handles PDF upload
- Calls enrichment service
- Shows progress to user

**File:** `/src/components/court-operations/ExtractedDataReview.tsx`
- Displays enriched data
- Allows manual edits
- Shows confidence scores

## Confidence Scoring

Base confidence starts at **0.85**

**Bonuses:**
- +0.05 if judge and part found
- +0.05 if cases found
- +0.10 if room number auto-populated

**Maximum:** 0.95 (always leave some room for manual review)

## Example Enrichment

**Input (from PDF):**
```json
{
  "part_number": "22",
  "judge_name": "Statzinger",
  "cases": [
    {
      "sending_part": "22",
      "defendant": "John Doe",
      "purpose": "Arraignment",
      "transfer_date": "2025-01-15",
      "top_charge": "Assault",
      "status": "Pending",
      "attorney": "Smith & Associates",
      "estimated_final_date": "2025-03-01"
    }
  ]
}
```

**Output (after enrichment):**
```json
{
  "part_number": "22",
  "judge_name": "Hon. Statzinger",  // ← Normalized from database
  "room_number": "1417",             // ← Auto-populated from part mapping
  "clerk_name": "A. CHAVARRIA",      // ← Auto-populated from assignments
  "calendar_day": "",
  "case_count": 1,
  "cases": [...],                    // ← Full case details preserved
  "confidence": 0.95,                // ← Increased due to successful enrichment
  // Aggregated fields for display
  "sending_part": "22",
  "defendants": "John Doe",
  "purpose": "Arraignment",
  "transfer_date": "2025-01-15",
  "top_charge": "Assault",
  "status": "Pending",
  "attorney": "Smith & Associates",
  "estimated_final_date": "2025-03-01"
}
```

## Benefits

### 1. **Reduced Manual Entry**
- Room numbers automatically filled
- Clerk names automatically assigned
- Judge names normalized to official format

### 2. **Data Consistency**
- Uses official names from database
- Prevents typos and variations
- Maintains referential integrity

### 3. **Improved Accuracy**
- Higher confidence scores
- Fewer errors in review
- Better data quality

### 4. **Time Savings**
- Less manual editing required
- Faster approval process
- More efficient workflow

## Usage

### In Code:
```typescript
import { enrichSessionData } from '@/services/court/pdfEnrichmentService';

// After PDF extraction
const rawSessions = extractedData.entries;

// Enrich with database data
const enrichedSessions = await enrichSessionData(rawSessions, '111');

// enrichedSessions now have room numbers, clerk names, etc.
```

### In UI:
1. Upload PDF via "Upload Daily Report" button
2. System extracts data with AI
3. **NEW:** System enriches with database data
4. Review enriched data in dialog
5. Edit any fields if needed
6. Approve to save

## Troubleshooting

### Room Number Not Found
**Possible Causes:**
- Part number not in `court_rooms` table
- Judge name doesn't match any assignment
- Building code incorrect

**Solution:**
- Add part-to-room mapping in database
- Update court assignments
- Verify building code parameter

### Judge Name Not Normalized
**Possible Causes:**
- Judge not in `personnel_profiles` table
- Name format too different from database

**Solution:**
- Add judge to personnel_profiles
- Use more flexible matching logic
- Manual edit in review dialog

### Clerk Name Missing
**Possible Causes:**
- No assignment for that room
- Room not found (see above)

**Solution:**
- Create court assignment for room
- Assign clerk to room in database
- Manual entry in review dialog

## Future Enhancements

### Potential Improvements:
1. **Fuzzy Matching** - Better name matching with Levenshtein distance
2. **Historical Data** - Use past assignments as fallback
3. **Sergeant Auto-fill** - Similar to clerk auto-fill
4. **Phone/Fax Auto-fill** - From court_rooms table
5. **Validation Rules** - Check for conflicts and duplicates
6. **Batch Processing** - Handle multiple PDFs at once
7. **Learning System** - Improve matching over time

## API Reference

### `enrichSessionData(sessions, buildingCode)`
Main enrichment function

**Parameters:**
- `sessions: ExtractedSession[]` - Raw sessions from PDF
- `buildingCode: '100' | '111'` - Building identifier

**Returns:** `Promise<ExtractedSession[]>` - Enriched sessions

**Example:**
```typescript
const enriched = await enrichSessionData(rawSessions, '111');
```

### `loadEnrichmentData(buildingCode)`
Loads all database data for enrichment

**Parameters:**
- `buildingCode: '100' | '111'` - Building identifier

**Returns:** `Promise<EnrichmentCache>` - Cached data

### `clearEnrichmentCache()`
Clears the enrichment cache (call when data changes)

**Returns:** `void`

## Performance

### Caching Strategy:
- Enrichment data loaded once per session
- Cached in memory for subsequent enrichments
- Clear cache when court data changes

### Typical Performance:
- Load enrichment data: ~200-500ms (one time)
- Enrich single session: ~1-5ms
- Enrich 30 sessions: ~30-150ms

### Optimization Tips:
- Cache persists across multiple uploads
- Call `clearEnrichmentCache()` only when needed
- Use batch enrichment for multiple PDFs
