// Semantic status / priority / type styling — uses design-token surfaces only.
// Returns Tailwind class strings using the project's semantic surface tokens.

export const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'lighting':
      return 'bg-surface-info text-surface-info-foreground border border-status-info/30';
    default:
      return 'bg-surface-neutral text-surface-neutral-foreground border border-border';
  }
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-surface-warning text-surface-warning-foreground border border-status-warning/30';
    case 'in_progress':
      return 'bg-surface-info text-surface-info-foreground border border-status-info/30';
    case 'resolved':
      return 'bg-surface-operational text-surface-operational-foreground border border-status-operational/30';
    default:
      return 'bg-surface-neutral text-surface-neutral-foreground border border-border';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'bg-surface-critical text-surface-critical-foreground border border-status-critical/30';
    case 'medium':
      return 'bg-surface-warning text-surface-warning-foreground border border-status-warning/30';
    case 'low':
      return 'bg-surface-operational text-surface-operational-foreground border border-status-operational/30';
    default:
      return 'bg-surface-neutral text-surface-neutral-foreground border border-border';
  }
};
