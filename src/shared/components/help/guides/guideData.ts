import {
  BookOpen,
  Building2,
  AlertTriangle,
  Gavel,
  KeyRound,
  Package2,
  Lightbulb,
  Smartphone,
  Bell,
  User,
  LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/config/roles';

export interface GuideItem {
  question: string;
  answer: string;
  /** Optional role filter. Omit to show to everyone. */
  roles?: UserRole[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: GuideItem[];
}

/**
 * In-app FAQ content. Kept in sync with the current UI — when a feature
 * moves, update the matching answer here so /help stays useful.
 */
export const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting around',
    icon: BookOpen,
    items: [
      {
        question: 'Where do I find things?',
        answer:
          'On desktop, use the sidebar on the left — it shows the pages your role can reach. On mobile, use the bottom tab bar (Dashboard / Spaces / Operations / Keys / More) or the hamburger menu in the top-left.',
      },
      {
        question: 'How do I switch light and dark mode?',
        answer:
          'Click the sun/moon icon in the top header (desktop only — on mobile, it lives inside your Profile page under Settings). Your preference is saved automatically.',
      },
      {
        question: 'How do I update my profile or set my room?',
        answer:
          'Click your avatar in the top-right to open your Profile. From there you can set your name, contact info, and the room you sit in. Your room is what auto-populates forms like Report Issue and Order Supplies.',
      },
      {
        question: 'Where is global search?',
        answer:
          'Admins have a search button in the header (also opens with ⌘K / Ctrl+K). It searches across rooms, issues, supplies, and people.',
      },
    ],
  },
  {
    id: 'requests',
    title: 'Submitting requests',
    icon: AlertTriangle,
    items: [
      {
        question: 'How do I order supplies?',
        answer:
          'Click "+ New" in the top header and pick "Order Supplies" — or go to /supplies and use the "Order" tab. Add items to your cart, set delivery location, and submit. You\'ll see the order under "My Requests" once it\'s in.',
      },
      {
        question: 'How do I report a facility issue (broken door, leak, etc.)?',
        answer:
          'Non-admins: click "Report Issue" in the top header (or the "+" floating button on mobile). Admins/facilities managers: use the Operations page → Issues tab → "Report" button. Pick the room, type, and urgency.',
      },
      {
        question: 'How do I report a lighting problem?',
        answer:
          'Use "+ New" → "Report Lighting", or go directly to /lighting/report. You can pick the room, mark which fixtures are out, and note bulb type / ceiling access if you know them.',
      },
      {
        question: 'How do I request a key?',
        answer:
          'Use "+ New" → "Request a Key" (route: /keys/request). Routes to the Facility Coordinator for approval. You can also email the facility office directly if the system is down.',
      },
      {
        question: 'Where do I see what I\'ve submitted?',
        answer:
          'Open "My Requests" from your sidebar (route: /my-requests). It shows every supply order, key request, lighting report, and task you\'ve filed, with current status.',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations (admin & facilities)',
    icon: AlertTriangle,
    roles: undefined,
    items: [
      {
        question: 'How do I work through pending issues?',
        answer:
          'Operations → Issues tab. Filter by building/status/priority. Click any issue to open the detail drawer where you can change status (Open → In Progress → Resolved), assign someone, add notes, and attach photos.',
      },
      {
        question: 'How do I schedule maintenance?',
        answer:
          'Operations → Maintenance tab → "Schedule" button. Pick the room/area, type of work, dates, and assignee. Recurring jobs (paint, deep clean) can be added here.',
      },
      {
        question: 'What is the DCAS handoff panel?',
        answer:
          'Painting, shampooing, and similar work goes to an outside vendor (DCAS), not our internal staff. The "Pending DCAS Handoff" panel on Operations → Maintenance reminds you which scheduled jobs still need to be filed with DCAS, and lets you log the external ticket number once filed.',
      },
      {
        question: 'How do I move a judge / plan a chambers transition?',
        answer:
          'Court Operations (term-sheet) → Personnel → "Chambers Move Planner". It splits the prep work between DCAS items (paint/shampoo) and internal staff tasks (move furniture, deliver supplies) automatically.',
      },
    ],
  },
  {
    id: 'keys',
    title: 'Keys & lockboxes',
    icon: KeyRound,
    items: [
      {
        question: 'Where do I see what\'s in each lockbox?',
        answer:
          'Keys page → Lockbox tab (default). Each slot shows the key, who it\'s linked to, and current status (Available / Checked Out / Missing). Use the "Needs attention" filter to jump to the ones that need action.',
      },
      {
        question: 'How do I check a key out or back in?',
        answer:
          'Click the slot row, then use the action button (Check out / Check back in). The status pill updates immediately and the activity log records who did what.',
      },
      {
        question: 'How do I issue a new key from inventory?',
        answer:
          'Keys page → Inventory tab → pick a key type → "Issue". Assign to a person, note the purpose, and optionally link to a lockbox slot.',
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & supply room',
    icon: Package2,
    items: [
      {
        question: 'How do I fulfill a supply request (court aide workflow)?',
        answer:
          'Work Center or Supply Room page → pick up an approved request → status moves Submitted → Picking → Ready → Completed. Mark items picked as you grab them; status updates the requester in real time.',
      },
      {
        question: 'How do I add or edit an inventory item?',
        answer:
          'Inventory page → "Add Item" (or pencil on an existing row). Required: name, smallest unit. Recommended: pack size + packaging note so orderers know if "1" means 1 battery or 1 pack of 4. Set "require code above" if large quantities need supervisor approval.',
      },
      {
        question: 'Why does the supplies page hide raw stock numbers?',
        answer:
          'Non-admins see "in stock / low / out" only. The actual count is admin-only to prevent panic ordering. Admins can see exact quantities on the Inventory page.',
      },
    ],
  },
  {
    id: 'court',
    title: 'Court operations',
    icon: Gavel,
    items: [
      {
        question: 'Where do I see today\'s assignments?',
        answer:
          'Term Sheet page (/term-sheet). Filter by date or part. The grid shows every courtroom with its judge, clerks, and current status (in session / adjourned / dark).',
      },
      {
        question: 'How do I swap two judges between rooms?',
        answer:
          'Term Sheet → Personnel → "Swap Courtrooms" or drag-drop on the grid (admin/court_liaison only). The change is recorded in court_assignment_audit_log.',
      },
      {
        question: 'How do I upload a new term?',
        answer:
          'Term Sheet → "Upload Term" → drop the PDF. The system parses parts/judges/clerks and previews the assignments before you commit.',
      },
    ],
  },
  {
    id: 'mobile',
    title: 'Using the app on mobile',
    icon: Smartphone,
    items: [
      {
        question: 'How do I open the full menu on mobile?',
        answer:
          'Tap the hamburger icon in the top-left. The bottom tab bar covers the four most-used pages plus "More" for everything else.',
      },
      {
        question: 'What is the floating "+" button?',
        answer:
          'Quick-action menu for the most common requests (Order Supplies / Make a Request / Request a Key). It hides automatically on pages where it would duplicate an existing button.',
      },
      {
        question: 'Why are some tab strips cut off on the right?',
        answer:
          'They scroll horizontally — swipe left on the strip to see more options (e.g. "Missing" status filter on Keys, "Furniture" / "Miscellaneous" categories on Supplies).',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & alerts',
    icon: Bell,
    items: [
      {
        question: 'Where do I see notifications?',
        answer:
          'The bell icon in the header opens your unread notifications. A full archive lives at /notifications. Notifications update in real time — no refresh needed.',
      },
      {
        question: 'What triggers a notification?',
        answer:
          'Issues you reported get updates when status/assignee/priority change. Supply requests notify on approval, picking, ready, and completion. Admins also get pending-approval alerts.',
      },
    ],
  },
  {
    id: 'access',
    title: 'Access & roles',
    icon: User,
    items: [
      {
        question: 'Why can\'t I see a page someone else can?',
        answer:
          'Each role has a different sidebar and set of permissions. If you need access to something not on your sidebar, contact an admin — don\'t bookmark and force-load the URL, it will just bounce you back.',
      },
      {
        question: 'How do I get a different role?',
        answer:
          'A System Admin must update your role under Admin → Users. They can also bump your job title, which auto-assigns the matching role for some titles (see title_access_rules).',
      },
      {
        question: 'Why does the page reload sometimes when I log in?',
        answer:
          'Your role and permissions are cached for 5 minutes. If you were just approved or your role changed, a quick reload pulls the new permissions.',
      },
    ],
  },
];

/**
 * Filter guides + items by role. Items without a `roles` list show to everyone.
 */
export function filterGuidesForRole(
  sections: GuideSection[],
  role: UserRole | null,
): GuideSection[] {
  if (!role) return sections;
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
    }))
    .filter((s) => s.items.length > 0);
}
