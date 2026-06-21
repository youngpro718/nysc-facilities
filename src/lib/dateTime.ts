import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatDateTime(value: string | Date): string {
  return format(new Date(value), 'MMM d, yyyy, h:mm a');
}

export function formatDate(value: string | Date): string {
  return format(new Date(value), 'MMM d, yyyy');
}

export function formatRelativeTime(value: string | Date): string {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

