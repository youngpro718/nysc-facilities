
export interface TimelineEvent {
  id: string;
  issue_id: string;
  action_type: string;
  performed_by: string;
  performed_at: string;
  previous_status?: string;
  new_status?: string;
  action_details?: any;
  notes?: string;
}
