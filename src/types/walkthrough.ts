export interface WalkthroughSession {
  id: string;
  hallway_id: string | null;
  floor_id: string | null;
  started_by: string;
  started_at: string;
  completed_at: string | null;
  total_fixtures: number;
  fixtures_checked: number;
  issues_found: number;
  ballast_issues_found: number;
  notes: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
}

export interface FixtureScan {
  id: string;
  fixture_id: string;
  scanned_by: string | null;
  scanned_at: string;
  action_taken: string | null;
  scan_location: string | null;
  device_info: Record<string, any>;
}

export interface HallwayWithHierarchy {
  id: string;
  name: string;
  floor_id: string;
  tier?: 'main' | 'connector' | 'wing' | 'private' | null;
  code?: string | null;
  parent_hallway_id?: string | null;
  start_reference?: string | null;
  end_reference?: string | null;
  estimated_walk_time_seconds?: number | null;
  type: string;
  section: string;
  status: string;
}

export type QuickAction = 'mark_out' | 'ballast_issue' | 'maintenance_needed' | 'mark_functional' | 'skip';

export interface QuickActionResult {
  success: boolean;
  message: string;
  fixtureId: string;
  action: QuickAction;
}
