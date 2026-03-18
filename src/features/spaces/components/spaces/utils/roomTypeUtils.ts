
/**
 * Utility functions for working with room types
 */

// Get a color class for a room type
export const getRoomTypeColor = (roomType: string | undefined): string => {
  if (!roomType) return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
  
  switch (roomType.toLowerCase()) {
    case 'office':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800';
    case 'courtroom':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800';
    case 'chamber':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800';
    case 'storage':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800';
    case 'meeting':
    case 'conference':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800';
    case 'utility':
      return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
    case 'reception':
      return 'bg-pink-100 text-pink-800';
    case 'restroom':
      return 'bg-cyan-100 text-cyan-800';
    case 'security':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
  }
};

// Get a display name for a room type
export const getRoomTypeName = (roomType: string | undefined): string => {
  if (!roomType) return 'Unknown';
  
  switch (roomType.toLowerCase()) {
    case 'office':
      return 'Office';
    case 'courtroom':
      return 'Courtroom';
    case 'chamber':
      return 'Chamber';
    case 'storage':
      return 'Storage';
    case 'meeting':
      return 'Meeting Room';
    case 'conference':
      return 'Conference Room';
    case 'utility':
      return 'Utility Room';
    case 'reception':
      return 'Reception Area';
    case 'restroom':
      return 'Restroom';
    case 'security':
      return 'Security Room';
    default:
      return roomType.charAt(0).toUpperCase() + roomType.slice(1);
  }
};

// Get status color
export const getStatusColor = (status: string | undefined): string => {
  if (!status) return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800';
    case 'inactive':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800';
    case 'under_maintenance':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
  }
};
