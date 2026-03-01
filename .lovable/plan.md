

## Plan

### 1. Delete all test absence records
Use the Supabase insert tool to run `DELETE FROM staff_absences` to clear all 7 test records (A. CLOTT x3, M. RODNEY, M. LEWIS, B. LANTRY, R. ROSENTHAL).

### 2. Conflict Detection Review
The conflict detection service is functioning correctly. It checks:
- **Double-booked judges** (same judge in multiple rooms)
- **Duplicate part numbers** (same part assigned to multiple rooms)
- **Missing required staff** (rooms without judge, clerk, or sergeant)
- **Incomplete assignments** (missing fax, phone, or part number)

No code changes needed for conflict detection — the logic is sound and cross-references live data from `court_assignments`.

### Technical Detail
The `staff_absences` table currently holds these test records:
| Staff | Reason | Dates |
|-------|--------|-------|
| A. CLOTT | retired | Oct 22 – Dec 31, 2025 |
| A. CLOTT | vacation | Oct 21 – 30, 2025 |
| A. CLOTT | sick | Oct 21, 2025 |
| B. LANTRY | vacation | Oct 21 – 24, 2025 |
| R. ROSENTHAL | sick | Oct 21 – 23, 2025 |
| M. RODNEY | other | Oct 27 – 29, 2025 |
| M. LEWIS | other | Oct 23 – 24, 2025 |

All will be deleted. The absence counters and calendar will reset to zero.

