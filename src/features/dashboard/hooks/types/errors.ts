
export class DashboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardError';
  }
}

export class UserDataError extends DashboardError {
  constructor(message: string) {
    super(message);
    this.name = 'UserDataError';
  }
}

export class IssueError extends DashboardError {
  constructor(message: string) {
    super(message);
    this.name = 'IssueError';
  }
}

export class BuildingError extends DashboardError {
  constructor(message: string) {
    super(message);
    this.name = 'BuildingError';
  }
}

export class AuthorizationError extends DashboardError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
