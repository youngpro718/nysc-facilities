# Command Center - Phase 7

## Overview
The admin dashboard has been transformed into a comprehensive command center with real-time system monitoring, metrics, alerts, and quick actions.

## Architecture

### Service Layer
**`commandCenterService.ts`** - Unified service for fetching system metrics
- `getSystemMetrics()` - Comprehensive metrics across all modules
- `getRecentActivity()` - Latest system events and user actions
- `getSystemAlerts()` - Auto-generated alerts based on thresholds

### Hook Layer
**`useCommandCenter.ts`** - React Query hook with auto-refresh
- 30-second stale time
- 60-second refetch interval
- Provides metrics, activity, and alerts

### Component Layer
**`CommandCenter.tsx`** - Main dashboard component
- Real-time KPI cards
- System health monitoring
- Alert banners (critical/warning)
- Recent activity feed
- Quick action buttons

## Metrics Tracked

### Issue Metrics
- Total, open, in progress, resolved
- Critical, high, medium, low priority counts
- Today's issues, this week's issues
- Average resolution time (hours)

### Supply Metrics
- Total requests, pending approval
- Submitted, in progress, ready
- Completed today
- Low stock items count

### Task Metrics
- Total, pending, in progress, completed
- Overdue tasks
- Due today

### Room Metrics
- Total rooms, active, maintenance, inactive
- Health percentage

### User Metrics
- Total users, active users
- Pending approval, suspended
- Online now (placeholder for future realtime)

### Court Metrics
- Total courtrooms, operational, maintenance
- Sessions today
- Active terms

## Alert System

Alerts are auto-generated based on thresholds:

### Critical Alerts
- Critical issues detected (any count > 0)
- Room health < 50%

### Warning Alerts
- Low stock items > 5
- Pending supply approvals > 10
- Room health 50-70%
- Overdue tasks > 0

### Info Alerts
- Pending user approvals > 5

## Features

### Real-Time Updates
- Auto-refresh every 60 seconds
- Manual refresh button
- Optimistic UI updates

### Navigation
- All cards are clickable
- Navigate to relevant sections
- Quick action buttons for common tasks

### Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Skeleton loading states

## Integration

The command center is integrated into:
- `/admin` - Main admin dashboard route
- Replaces old `GlobalKPIStrip` + `BuildingsGrid` pattern
- Maintains `AdminGreeting` and `ProductionSecurityGuard`

## Performance

- Uses React Query for caching
- Parallel data fetching
- Optimized queries (select only needed fields)
- Leverages existing RPC functions (e.g., `get_issue_stats`)

## Future Enhancements

1. **Real-time Presence** - Track online users via Supabase Realtime
2. **Alert Acknowledgment** - Allow admins to acknowledge/dismiss alerts
3. **Custom Dashboards** - Let admins configure their own KPI layout
4. **Trend Charts** - Add sparklines/charts for metric trends
5. **Export Reports** - Generate PDF/CSV reports from metrics
6. **Notification Integration** - Push alerts to admin notification panel

## Migration Notes

### Replaced Components
- `GlobalKPIStrip` - Now part of CommandCenter
- `BuildingsGrid` - Removed (buildings accessible via Spaces nav)
- `PendingSupplyApprovals` - Integrated into supply metrics

### Preserved Components
- `AdminGreeting` - Still used for personalization
- `ProductionSecurityGuard` - Security check remains

### Benefits
- **Single source of truth** for all admin metrics
- **Consistent UI** across all metric cards
- **Better performance** with unified queries
- **Easier maintenance** with centralized service
- **Scalable** - easy to add new metrics/alerts
