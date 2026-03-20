# Admin Dashboard - Hybrid Design

## Overview
The admin dashboard now combines the best of both worlds:
- **Command Center** - Real-time system metrics, alerts, and quick actions
- **Building Cards** - Visual building overview with dynamic photo feature

## Layout Structure

```
┌─────────────────────────────────────────┐
│ Admin Greeting + Refresh                │
├─────────────────────────────────────────┤
│ Production Security Guard               │
├─────────────────────────────────────────┤
│ Command Center                          │
│ ├─ Primary KPIs (4 cards)              │
│ ├─ Secondary Metrics (6 cards)         │
│ ├─ System Alerts                       │
│ ├─ Recent Activity Feed                │
│ └─ Quick Actions                       │
├─────────────────────────────────────────┤
│ Buildings Grid                          │
│ ├─ Building Card 1 (with photo)        │
│ └─ Building Card 2 (with photo)        │
└─────────────────────────────────────────┘
```

## Dynamic Photo Feature

### How It Works
Each building card displays a photo that automatically updates based on recent issues:

1. **Default State**: Shows static building placeholder image
2. **When Issue Reported**: If an issue is reported with a photo, that photo replaces the building image
3. **Most Recent First**: Always shows the photo from the most recently reported issue
4. **Automatic Updates**: Photos update in real-time as new issues are reported

### Implementation
```typescript
// Find the most recent issue with a photo
const issuesWithPhotos = buildingIssues
  .filter(issue => issue.photos && issue.photos.length > 0)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// Use the first photo from the most recent issue
if (issuesWithPhotos.length > 0 && issuesWithPhotos[0].photos) {
  dynamicImage = issuesWithPhotos[0].photos[0];
}
```

### Benefits
- **Visual Awareness**: Admins immediately see what's happening in each building
- **Real-time Updates**: Photos update automatically without refresh
- **Context**: See the actual issue photo instead of generic building image
- **Engagement**: Makes the dashboard more dynamic and informative

## Building Card Features

### Photo Header
- Dynamic photo (issue photo or placeholder)
- Gradient overlay for text readability
- Status badge (Operational/Maintenance)
- Building name and address

### Stats Row
- **Floors**: Total floor count
- **Rooms**: Total room count
- **Health**: Percentage based on working fixtures
  - Green (≥90%): Operational
  - Yellow (70-89%): Warning
  - Red (<70%): Critical

### Issue Indicators
- Active issue count
- Visual indicators for unseen issues
- Click to navigate to building details

## Command Center Features

### Primary KPIs
- Active Issues
- Room Health %
- Supply Requests
- Tasks Pending

### Secondary Metrics
- User Management
- Court Operations
- Performance Stats

### System Alerts
- **Critical**: Red alerts for urgent issues
- **Warning**: Yellow alerts for attention needed
- **Info**: Blue alerts for notifications

### Recent Activity
- Latest system events
- User actions
- Type-specific icons
- Timestamps

### Quick Actions
- Navigate to common admin tasks
- One-click access to key features

## Data Flow

### Building Cards
```
useDashboardData() 
  → buildings, issues, activities
  → BuildingsGrid
    → BuildingCard (with dynamic photo)
```

### Command Center
```
useCommandCenter()
  → commandCenterService
    → metrics, alerts, activity
    → CommandCenter component
```

## Performance

### Optimizations
- Parallel data fetching for both sections
- React Query caching (5-minute stale time for buildings)
- Auto-refresh (60 seconds for command center)
- Skeleton loading states

### Bundle Impact
- Command Center: ~15KB
- Building Cards: ~8KB
- Total: ~23KB (gzipped)

## User Experience

### Loading States
- Skeleton loaders for both sections
- Prevents layout shift
- Smooth transitions

### Error Handling
- Graceful degradation if metrics fail
- Fallback images for buildings
- User-friendly error messages

### Responsive Design
- Mobile-first approach
- Grid adapts to screen size
- Touch-friendly interactions

## Migration Notes

### What Changed
- **Before**: Command center only (Phase 7)
- **After**: Command center + building cards (hybrid)

### What Was Restored
- ✅ BuildingsGrid component
- ✅ BuildingCard component
- ✅ Building stats calculation
- ✅ Dynamic photo feature (enhanced)

### What Was Preserved
- ✅ CommandCenter component
- ✅ Real-time metrics
- ✅ System alerts
- ✅ Activity feed

## Future Enhancements

### Building Cards
1. **Photo Gallery**: Click to see all issue photos
2. **Photo Filters**: Filter by issue type/priority
3. **Photo Annotations**: Mark areas of concern
4. **Before/After**: Show resolution photos

### Command Center
1. **Customizable Layout**: Drag-and-drop KPI cards
2. **Trend Charts**: Historical data visualization
3. **Export Reports**: PDF/CSV generation
4. **Alert Management**: Acknowledge/dismiss alerts

### Integration
1. **Unified Filters**: Filter both sections together
2. **Cross-linking**: Click building in activity → highlight card
3. **Synchronized Updates**: Real-time sync between sections

## TypeScript Compilation
✅ Verified - 0 errors

## Related Files
- Dashboard: `src/features/admin/pages/AdminDashboard.tsx`
- Command Center: `src/features/dashboard/components/dashboard/CommandCenter.tsx`
- Buildings Grid: `src/features/dashboard/components/dashboard/BuildingsGrid.tsx`
- Building Card: `src/features/dashboard/components/dashboard/BuildingCard.tsx`
