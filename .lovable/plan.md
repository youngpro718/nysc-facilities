

## Problem

Three judges (B. LANTRY, M. BEST, S. ANTIGNANI) have `is_active: false` but `judge_status = 'active'` in `personnel_profiles`. The hook filters them out via `is_active` but they never appear in the departed list either — they're ghosts in the system.

A. CLOTT is the only one properly marked (`is_active: false` + `judge_status: departed`).

## Fix

### 1. Data fix — correct the 3 inconsistent judge records
Run a migration to set `judge_status = 'departed'` for the 3 judges who have `is_active = false` but `judge_status = 'active'`:
```sql
UPDATE personnel_profiles
SET judge_status = 'departed'
WHERE is_active = false AND judge_status = 'active' AND primary_role = 'judge';
```

### 2. Code fix — make the hook resilient to this inconsistency going forward
In `useCourtPersonnel.ts`, update the `judgeStatus` mapping so any judge with `is_active = false` is treated as `departed` regardless of `judge_status` value:
```ts
judgeStatus: person.is_active === false ? 'departed' : (person.judge_status as JudgeStatus) || 'active',
```

This ensures the cards accurately reflect:
- **Judges count**: only truly active judges
- **Departed badge**: all removed/inactive judges show in the departed count
- No judges fall into an invisible limbo state

### Summary of current judge data after fix
- **28 active judges** (including 1 JHO: R. PICKHOLZ)
- **4 departed** (A. CLOTT, B. LANTRY, M. BEST, S. ANTIGNANI)

