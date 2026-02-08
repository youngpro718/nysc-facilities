
export const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'lighting':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 border-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 border-gray-200';
  }
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 border-yellow-200 dark:border-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 border-blue-200 dark:border-blue-800';
    case 'resolved':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 border-green-200 dark:border-green-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 border-gray-200';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 border-red-200 dark:border-red-800';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 border-yellow-200 dark:border-yellow-800';
    case 'low':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 border-green-200 dark:border-green-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 border-gray-200';
  }
};
