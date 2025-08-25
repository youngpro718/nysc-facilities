// Temporary types for components that reference the old AdminIssuesHub
export type GroupingMode = 'none' | 'status' | 'priority' | 'department' | 'assignee' | 'date' | 'room' | 'reporter';
export type ViewMode = 'grid' | 'list' | 'kanban' | 'timeline' | 'board' | 'table' | 'cards';
export type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
export type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';