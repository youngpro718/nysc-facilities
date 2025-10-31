
import { Issue, IssueStatus, IssuePriority, FixtureType, FixtureStatus, FixturePosition, LightingFixture } from "../types/IssueTypes";

interface DatabaseIssue {
  id: string;
  title: string;
  description: string;
  type: string;
  issue_type?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  photos: string[];
  seen: boolean;
  buildings?: { name: string } | null;
  floors?: { name: string } | null;
  rooms?: { name: string } | null;
  lighting_fixtures?: {
    name: string;
    type: string;
    status: string;
    position: string;
    electrical_issues: any;
  } | null;
}

const isValidFixtureType = (value: string | null): value is FixtureType => {
  return ['standard', 'emergency', 'motion_sensor'].includes(value || '');
};

const isValidFixtureStatus = (value: string | null): value is FixtureStatus => {
  return ['functional', 'maintenance_needed', 'non_functional', 'pending_maintenance', 'scheduled_replacement'].includes(value || '');
};

const isValidFixturePosition = (value: string | null): value is FixturePosition => {
  return ['ceiling', 'wall', 'floor', 'desk', 'recessed'].includes(value || '');
};

export const isValidIssueStatus = (value: string | null): value is IssueStatus => {
  return ['open', 'in_progress', 'resolved'].includes(value || '');
};

export const isValidIssuePriority = (value: string | null): value is IssuePriority => {
  return ['high', 'medium', 'low'].includes(value || '');
};

const transformFixture = (fixtureData: DatabaseIssue['lighting_fixtures']): LightingFixture | null => {
  if (!fixtureData) return null;

  const type = fixtureData.type as FixtureType;
  const status = fixtureData.status as FixtureStatus;
  const position = fixtureData.position as FixturePosition;

  if (!isValidFixtureType(type) || !isValidFixtureStatus(status) || !isValidFixturePosition(position)) {
    return null;
  }

  return {
    name: fixtureData.name,
    type,
    status,
    position,
    electrical_issues: fixtureData.electrical_issues || {}
  };
};

export const transformIssue = (dbIssue: DatabaseIssue): Issue => {
  const fixture = dbIssue.lighting_fixtures ? transformFixture(dbIssue.lighting_fixtures) : null;
  
  return {
    id: dbIssue.id,
    title: dbIssue.title,
    description: dbIssue.description,
    issue_type: dbIssue.issue_type || dbIssue.type || '',
    status: isValidIssueStatus(dbIssue.status) ? dbIssue.status : 'open',
    priority: isValidIssuePriority(dbIssue.priority) ? dbIssue.priority : 'medium',
    created_at: dbIssue.created_at,
    updated_at: dbIssue.updated_at,
    photos: dbIssue.photos || [],
    seen: dbIssue.seen,
    buildings: dbIssue.buildings,
    floors: dbIssue.floors,
    rooms: dbIssue.rooms,
    lighting_fixtures: fixture ? [fixture] : []
  };
};

export type { DatabaseIssue };
