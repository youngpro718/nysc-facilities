import { type LucideIcon, AlertTriangle, LayoutDashboard, Package, ClipboardList, KeyRound, Gavel, Boxes, Wrench, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type UserRole, getRoleLabel, getRoleDescription } from '@/config/roles';
import { getDashboardForRole } from '@/routes/roleBasedRouting';

export interface OnboardingHighlight {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface OnboardingAction {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export interface OnboardingRoleContent {
  role: UserRole;
  label: string;
  description: string;
  intro: string;
  focusTitle: string;
  focusPoints: string[];
  highlights: OnboardingHighlight[];
  primaryAction: OnboardingAction;
  secondaryAction: OnboardingAction;
  completionTitle: string;
  completionDescription: string;
}

const standardContent: OnboardingRoleContent = {
  role: 'standard',
  label: getRoleLabel('standard'),
  description: getRoleDescription('standard'),
  intro: 'You only need the essentials: report issues, request supplies, and track your requests.',
  focusTitle: 'Your first things to do',
  focusPoints: [
    'Use the request hub to report an issue or ask for supplies.',
    'Check My Activity to follow the status of anything you submitted.',
    'Use the dashboard for quick actions instead of learning every module.',
  ],
  highlights: [
    {
      title: 'Report issues fast',
      description: 'Send maintenance and facility problems straight from the request hub.',
      icon: AlertTriangle,
    },
    {
      title: 'Order supplies',
      description: 'Request the materials you need without going through every admin screen.',
      icon: Package,
    },
    {
      title: 'Track updates',
      description: 'See requests, responses, and progress in one place.',
      icon: ClipboardList,
    },
  ],
  primaryAction: {
    title: 'Open request hub',
    description: 'Start with issue reporting and supply requests.',
    path: '/request',
    icon: AlertTriangle,
  },
  secondaryAction: {
    title: 'Go to dashboard',
    description: 'See your personal overview and request status.',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  completionTitle: 'You are ready to start',
  completionDescription: 'Report issues, request supplies, and track everything you submit without getting lost in extra pages.',
};

const courtAideContent: OnboardingRoleContent = {
  role: 'court_aide',
  label: getRoleLabel('court_aide'),
  description: getRoleDescription('court_aide'),
  intro: 'Your workspace focuses on fulfilling supply requests, keeping inventory moving, and completing assigned tasks.',
  focusTitle: 'What matters most for you',
  focusPoints: [
    'Open the Supply Room to claim and process supply requests.',
    'Use Inventory to check stock before fulfilling anything.',
    'Keep an eye on Tasks for the day-to-day work queue.',
  ],
  highlights: [
    {
      title: 'Fulfill requests',
      description: 'See pending supply work and move it through the fulfillment flow.',
      icon: Package,
    },
    {
      title: 'Keep stock current',
      description: 'Review inventory levels before you confirm anything is available.',
      icon: Boxes,
    },
    {
      title: 'Stay on task',
      description: 'Track what is waiting on you and finish it in order.',
      icon: ClipboardList,
    },
  ],
  primaryAction: {
    title: 'Open supply room',
    description: 'Start where you will spend most of your time.',
    path: '/supply-room',
    icon: Package,
  },
  secondaryAction: {
    title: 'Go to work center',
    description: 'Review your dashboard and task summary.',
    path: '/court-aide-dashboard',
    icon: LayoutDashboard,
  },
  completionTitle: 'Your supply workspace is ready',
  completionDescription: 'You can now move from request to fulfillment without seeing unrelated admin details.',
};

const purchasingContent: OnboardingRoleContent = {
  role: 'purchasing',
  label: getRoleLabel('purchasing'),
  description: getRoleDescription('purchasing'),
  intro: 'You mainly watch inventory, review supply demand, and keep procurement moving.',
  focusTitle: 'Your day-to-day focus',
  focusPoints: [
    'Open Inventory to check stock levels and reorder pressure.',
    'Use Supply Room to review incoming supply work.',
    'Watch request activity so you can respond to shortages early.',
  ],
  highlights: [
    {
      title: 'Monitor stock',
      description: 'Keep an eye on what is running low before it becomes a problem.',
      icon: Boxes,
    },
    {
      title: 'Review requests',
      description: 'See what supply work is waiting and decide what needs action.',
      icon: Package,
    },
    {
      title: 'Track procurement',
      description: 'Stay ahead of purchases and replenishment decisions.',
      icon: ClipboardList,
    },
  ],
  primaryAction: {
    title: 'Open inventory',
    description: 'Jump straight to the stock view you will use most.',
    path: '/inventory',
    icon: Boxes,
  },
  secondaryAction: {
    title: 'Review supply room',
    description: 'See supply requests and fulfillment status.',
    path: '/supply-room',
    icon: Package,
  },
  completionTitle: 'Your inventory view is ready',
  completionDescription: 'You can now focus on stock, supply demand, and procurement instead of the rest of the system.',
};

const courtOfficerContent: OnboardingRoleContent = {
  role: 'court_officer',
  label: getRoleLabel('court_officer'),
  description: getRoleDescription('court_officer'),
  intro: 'You will mostly manage access, keys, and the spaces you oversee.',
  focusTitle: 'What you should use first',
  focusPoints: [
    'Use Keys to manage checkout, return, and assignment activity.',
    'Open Spaces to view the rooms and areas you oversee.',
    'Check your dashboard for a quick overview before moving into the details.',
  ],
  highlights: [
    {
      title: 'Manage keys',
      description: 'Keep key assignments and access tracking organized.',
      icon: KeyRound,
    },
    {
      title: 'See the spaces',
      description: 'Review the facility layout and rooms tied to your work.',
      icon: LayoutDashboard,
    },
    {
      title: 'Stay on security work',
      description: 'Keep your attention on access and operational visibility.',
      icon: ShieldCheck,
    },
  ],
  primaryAction: {
    title: 'Open keys',
    description: 'Go straight to the access workflow.',
    path: '/keys',
    icon: KeyRound,
  },
  secondaryAction: {
    title: 'Go to dashboard',
    description: 'See your main overview and notifications.',
    path: '/court-officer-dashboard',
    icon: LayoutDashboard,
  },
  completionTitle: 'Your access tools are ready',
  completionDescription: 'Everything you need for keys, access, and spaces is now grouped together.',
};

const cmcContent: OnboardingRoleContent = {
  role: 'cmc',
  label: getRoleLabel('cmc'),
  description: getRoleDescription('cmc'),
  intro: 'You will manage court operations, schedules, and the information that keeps sessions moving.',
  focusTitle: 'The essentials for your role',
  focusPoints: [
    'Open Court Operations to review sessions and courtroom activity.',
    'Use the supply room only when court operations need materials.',
    'Start from your dashboard when you want the high-level overview.',
  ],
  highlights: [
    {
      title: 'Court scheduling',
      description: 'Keep sessions and term activity organized.',
      icon: Gavel,
    },
    {
      title: 'Session readiness',
      description: 'Track what is coming up and what needs attention now.',
      icon: ClipboardList,
    },
    {
      title: 'Operational focus',
      description: 'Stay on court work instead of unrelated admin modules.',
      icon: LayoutDashboard,
    },
  ],
  primaryAction: {
    title: 'Open court operations',
    description: 'Go to the workflow you will use most.',
    path: '/court-operations',
    icon: Gavel,
  },
  secondaryAction: {
    title: 'Go to dashboard',
    description: 'See your court overview and activity.',
    path: '/cmc-dashboard',
    icon: LayoutDashboard,
  },
  completionTitle: 'Your court workspace is ready',
  completionDescription: 'You can now focus on the sessions and scheduling that matter to your court operations.',
};

const facilitiesManagerContent: OnboardingRoleContent = {
  role: 'facilities_manager',
  label: getRoleLabel('facilities_manager'),
  description: getRoleDescription('facilities_manager'),
  intro: 'You oversee spaces, maintenance, inventory, and daily operations from a single view.',
  focusTitle: 'What your role centers on',
  focusPoints: [
    'Open Operations for issues, maintenance, and supply requests.',
    'Use Spaces for building and room changes.',
    'Keep keys, inventory, and work queues moving together.',
  ],
  highlights: [
    {
      title: 'Manage spaces',
      description: 'Keep buildings, rooms, and hierarchy up to date.',
      icon: LayoutDashboard,
    },
    {
      title: 'Coordinate work',
      description: 'Stay on top of issues and maintenance requests.',
      icon: Wrench,
    },
    {
      title: 'Keep supply moving',
      description: 'Watch inventory and requests from one place.',
      icon: Package,
    },
  ],
  primaryAction: {
    title: 'Open operations',
    description: 'Go straight to the facilities workflow.',
    path: '/operations',
    icon: Wrench,
  },
  secondaryAction: {
    title: 'Go to dashboard',
    description: 'Open the main facilities overview.',
    path: '/',
    icon: LayoutDashboard,
  },
  completionTitle: 'Your facilities workspace is ready',
  completionDescription: 'You can now focus on spaces, operations, and the core work that belongs to you.',
};

const adminContent: OnboardingRoleContent = {
  role: 'admin',
  label: getRoleLabel('admin'),
  description: getRoleDescription('admin'),
  intro: 'You have full access, so onboarding should stay concise and get you into the system fast.',
  focusTitle: 'What you need at a glance',
  focusPoints: [
    'Use the admin dashboard for users, approvals, and system health.',
    'Jump into a specific module only when you need to investigate something.',
    'Skip the long walkthroughs and use the Help Center if you need a refresher later.',
  ],
  highlights: [
    {
      title: 'Admin overview',
      description: 'See the system state, approvals, and pending work quickly.',
      icon: LayoutDashboard,
    },
    {
      title: 'User management',
      description: 'Review access, profiles, and permissions without extra noise.',
      icon: CheckCircle2,
    },
    {
      title: 'System control',
      description: 'Handle settings and workflows from the same place.',
      icon: ShieldCheck,
    },
  ],
  primaryAction: {
    title: 'Open admin dashboard',
    description: 'Go straight to the main control center.',
    path: '/',
    icon: LayoutDashboard,
  },
  secondaryAction: {
    title: 'Open admin center',
    description: 'Go directly to the management tools.',
    path: '/admin',
    icon: ShieldCheck,
  },
  completionTitle: 'Admin access is ready',
  completionDescription: 'You can skip the heavy onboarding and jump straight into the dashboard and admin tools.',
};

const ROLE_CONTENT_MAP: Record<UserRole, OnboardingRoleContent> = {
  standard: standardContent,
  court_aide: courtAideContent,
  purchasing: purchasingContent,
  court_officer: courtOfficerContent,
  cmc: cmcContent,
  facilities_manager: facilitiesManagerContent,
  system_admin: adminContent,
  admin: adminContent,
};

export function getOnboardingContent(role: UserRole | string | null | undefined): OnboardingRoleContent {
  const normalizedRole = (role === 'admin' ? 'system_admin' : role) as UserRole | null | undefined;
  if (normalizedRole && normalizedRole in ROLE_CONTENT_MAP) {
    return ROLE_CONTENT_MAP[normalizedRole];
  }

  return ROLE_CONTENT_MAP.standard;
}

export function getOnboardingRolePath(role: UserRole | string | null | undefined): string {
  return getOnboardingContent(role).primaryAction.path;
}

export function getOnboardingRoleHomePath(role: UserRole | string | null | undefined): string {
  const resolved = getOnboardingContent(role);
  return resolved.secondaryAction.path || getDashboardForRole(resolved.role);
}
