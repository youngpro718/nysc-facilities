import SessionsPanel from './SessionsPanel';
import PasswordPolicyPanel from './PasswordPolicyPanel';
import RateLimitPanel from './RateLimitPanel';

/**
 * SecurityPanel - Composite security management panel
 * 
 * Combines three security management components:
 * - SessionsPanel: Manage active user sessions
 * - PasswordPolicyPanel: Configure password requirements
 * - RateLimitPanel: Configure rate limiting and unblock users
 */
export default function SecurityPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SessionsPanel />
        <PasswordPolicyPanel />
      </div>
      <RateLimitPanel />
    </div>
  );
}
