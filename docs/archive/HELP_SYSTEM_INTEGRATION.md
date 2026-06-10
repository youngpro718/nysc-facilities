# Help & Guides System - Database Integration Complete

**Date:** March 20, 2026  
**Status:** ✅ Fixed and Integrated

---

## Problem

The Help & Guides system was not working as intended because:
1. **No database integration** - Used hardcoded data instead of the `help_content` table from migration 061
2. **No onboarding checklist** - The `onboarding_checklist` table wasn't being used
3. **Missing hooks** - No React Query hooks to fetch help content from database
4. **Poor organization** - All content mixed together without clear categorization

---

## Solution Implemented

### 1. Created Database Hooks

**`src/features/help/hooks/useHelpContent.ts`**
- `useHelpContent(category?, roleSpecific?)` - Fetch help articles from database
- `useSearchHelpContent(searchQuery)` - Search help content by keywords
- `trackHelpView(contentKey)` - Track article views for analytics

**`src/features/help/hooks/useOnboardingChecklist.ts`**
- `useOnboardingChecklist()` - Fetch user's onboarding steps
- `completeStep(stepKey)` - Mark step as complete
- `initializeChecklist(userId)` - Initialize checklist for new users
- Progress tracking (completed count, percentage)

### 2. Created UI Components

**`src/features/help/components/HelpContentViewer.tsx`**
- Displays help articles from database
- Role-specific filtering (shows content relevant to user's role)
- Search functionality with keyword matching
- Click to expand/collapse articles
- Tracks view counts

**`src/features/help/components/OnboardingChecklist.tsx`**
- Interactive checklist with progress bar
- Click to mark steps complete
- Role-specific steps
- Visual completion indicators

### 3. Updated Help Center

**`src/shared/components/help/HelpCenter.tsx`**
- Added **4 tabs** for better organization:
  1. **Help Articles** - Database-backed help content (NEW)
  2. **Interactive Tours** - Existing page tours
  3. **Getting Started** - Onboarding checklist (NEW)
  4. **FAQ** - Legacy hardcoded guides
- Integrated new components
- Maintained existing tour functionality

---

## Features

### Help Articles (Database-Backed)
- ✅ Fetches from `help_content` table
- ✅ Role-specific filtering (shows relevant content for user's role)
- ✅ Category filtering (feature, role, workflow, troubleshooting)
- ✅ Full-text search across title, content, and keywords
- ✅ View count tracking for analytics
- ✅ Expandable/collapsible articles

### Onboarding Checklist
- ✅ Fetches from `onboarding_checklist` table
- ✅ Role-specific steps (different for each role)
- ✅ Progress tracking with visual progress bar
- ✅ Click to complete steps
- ✅ Completion indicators (checkmarks)
- ✅ Automatic initialization for new users

### Interactive Tours
- ✅ Existing functionality preserved
- ✅ Page-specific tours
- ✅ Completion tracking
- ✅ Search functionality

---

## Database Tables Used

### `help_content`
```sql
- id, content_key, title, content
- category (feature/role/workflow/troubleshooting)
- role_specific (NULL = all roles)
- related_feature
- search_keywords[]
- view_count
```

**Seeded Content:**
- Getting Started guide
- 5 role-specific guides (court_aide, court_officer, cmc, purchasing, facilities_manager)
- 4 feature guides (supply requests, lighting walkthroughs, key management, court sessions)

### `onboarding_checklist`
```sql
- id, user_id, step_key, step_title, step_description
- completed, completed_at
- step_order, role_specific
```

**Initialized Steps:**
- Common: Complete profile, explore dashboard, understand permissions
- Role-specific: Different for each role (e.g., court_aide gets inventory management steps)

### `feature_tours`
```sql
- id, user_id, tour_key, tour_name
- completed, dismissed
```

---

## Usage

### For Users

1. **Access Help Center:**
   - Click "Help & Guides" in sidebar
   - Or click "?" button in bottom-right corner
   - Navigate to `/help`

2. **View Help Articles:**
   - Go to "Help Articles" tab
   - Search or browse by category
   - Click to expand articles
   - Articles filtered by your role automatically

3. **Complete Onboarding:**
   - Go to "Getting Started" tab
   - Click checkboxes to mark steps complete
   - Track progress with progress bar

4. **Take Tours:**
   - Go to "Interactive Tours" tab
   - Click a tour to start
   - Or use "?" button on any page

### For Admins

1. **Add Help Content:**
```sql
INSERT INTO help_content (
  content_key, title, content, category, 
  role_specific, search_keywords
) VALUES (
  'new_feature_guide',
  'New Feature Guide',
  'Detailed explanation...',
  'feature',
  NULL, -- All roles
  ARRAY['feature', 'guide', 'new']
);
```

2. **View Analytics:**
```sql
SELECT title, view_count, category
FROM help_content
ORDER BY view_count DESC
LIMIT 10;
```

3. **Initialize Checklist for User:**
```sql
SELECT initialize_onboarding_checklist('user-uuid-here');
```

---

## Technical Details

### React Query Integration
- **Stale Time:** 5 minutes for help content, 2 minutes for search
- **Caching:** Automatic with query keys
- **Refetch:** On mount, not on window focus

### Role-Based Filtering
- Uses `useRolePermissions()` hook to get user's role
- Filters help content: `role_specific.eq.{role} OR role_specific.is.null`
- Shows general content + role-specific content

### Search Implementation
- PostgreSQL `ilike` for case-insensitive search
- Searches: title, content, keywords array
- Results ordered by view count (most popular first)
- Limit: 20 results

---

## Files Created/Modified

### Created (4 files)
- `src/features/help/hooks/useHelpContent.ts`
- `src/features/help/hooks/useOnboardingChecklist.ts`
- `src/features/help/components/HelpContentViewer.tsx`
- `src/features/help/components/OnboardingChecklist.tsx`

### Modified (1 file)
- `src/shared/components/help/HelpCenter.tsx` - Added tabs and integrated new components

---

## Testing

✅ **TypeScript Compilation:** Passed (0 errors)  
✅ **Database Integration:** Help content fetches from `help_content` table  
✅ **Role Filtering:** Shows correct content based on user role  
✅ **Search:** Full-text search works across all fields  
✅ **Onboarding:** Checklist displays and updates correctly  
✅ **Tours:** Existing tour functionality preserved  

---

## Next Steps (Optional Enhancements)

1. **Rich Text Editor** - Allow admins to add formatted help content
2. **Help Content CMS** - Admin UI to manage help articles
3. **Video Tutorials** - Embed video links in help content
4. **Feedback System** - "Was this helpful?" buttons on articles
5. **Related Articles** - Show related help content based on keywords
6. **Help Widget** - Contextual help on specific pages
7. **AI Chat Integration** - Connect to AI support chat mentioned in UI

---

## Summary

The Help & Guides system now properly integrates with the database tables created in migration 061. Users can:
- Browse role-specific help articles from the database
- Complete onboarding checklists tailored to their role
- Search help content with full-text search
- Take interactive tours (existing functionality)

All help content is now centrally managed in the database, making it easy to update and maintain without code changes.
