export type LightingIssueStatus = 'open' | 'deferred' | 'resolved';

export interface LightingIssue {
  id: string;
  location: string;
  bulb_type: string;
  form_factor?: string;
  issue_type: 'blown_bulb' | 'ballast_issue' | 'other';
  status: LightingIssueStatus;
  notes?: string;
  reported_at: string;
  resolved_at?: string;
}
