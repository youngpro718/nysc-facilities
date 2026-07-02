import {
  BookOpen,
  Building2,
  AlertTriangle,
  Gavel,
  KeyRound,
  Package2,
  Smartphone,
  Bell,
  User,
  ListChecks,
  Inbox,
  Wrench,
  ShieldCheck,
  LifeBuoy,
  Rocket,
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
  /** Short blurb shown under the section title. */
  blurb?: string;
  /** Optional role filter for the whole section. */
  roles?: UserRole[];
  items: GuideItem[];
}

// Helpers for readable role groups in items below.
const ADMIN_FM: UserRole[] = ['admin', 'system_admin', 'facilities_manager'];
const ADMINS: UserRole[] = ['admin', 'system_admin'];
const COURT_OPS: UserRole[] = ['admin', 'system_admin', 'court_liaison'];
const SUPPLY_STAFF: UserRole[] = [
  'admin',
  'system_admin',
  'facilities_manager',
  'court_aide',
  'purchasing',
];
const KEY_HANDLERS: UserRole[] = [
  'admin',
  'system_admin',
  'facilities_manager',
  'court_officer',
];

/**
 * In-app help content. Each section is a topic; each item is a Q&A.
 * Items without a `roles` filter show to every signed-in user. The renderer
 * drops sections whose items all filter out for the current role.
 *
 * When the UI changes, update the matching answer here so /help stays useful.
 */
export const guideSections: GuideSection[] = [
  // ─── 1. Quick start ─────────────────────────────────────────────────────
  {
    id: 'quick-start',
    title: 'Quick start',
    icon: Rocket,
    blurb: "First time here? These five steps cover what most people need on day one.",
    items: [
      {
        question: '1. Open your profile and set your home room',
        answer:
          'Click your avatar in the top-right → Profile. Set your name, contact info, and the room you sit in. Your home room auto-fills the delivery field on supply orders and the location field on issue reports, so this is the single biggest time-saver — set it once and forget about it.',
      },
      {
        question: '2. Bookmark the right starting page',
        answer:
          'Your sidebar shows the pages your role can reach. Most people use Dashboard (or Work Center, for court aides) day-to-day. If a page you expect to see is missing, ask an admin to check your role.',
      },
      {
        question: '3. Try the "+ New" menu in the header',
        answer:
          'The "+ New" button (top header, desktop) opens a small menu with the most common requests: Order Supplies, Make a Request, Request a Key, Report Lighting. On mobile, the floating "+" button in the lower-right does the same thing.',
      },
      {
        question: '4. Submit something small so it shows up in My Requests',
        answer:
          'Try ordering a single item or reporting a minor issue. Then open "My Requests" from the sidebar (route: /my-requests) to see it land. The page becomes a lot more useful once you have a few items in it.',
      },
      {
        question: '5. Turn on notifications in your browser',
        answer:
          'Status changes (your supply order moves to Picking, your issue gets assigned, etc.) push to the bell icon in real time. If your browser asks for notification permission, allow it so you get them even when this tab is in the background.',
      },
    ],
  },

  // ─── 2. Navigating the app ──────────────────────────────────────────────
  {
    id: 'getting-around',
    title: 'Navigating the app',
    icon: BookOpen,
    blurb: 'How to find pages, switch theme, and use search.',
    items: [
      {
        question: 'Where do I find things?',
        answer:
          'On desktop, the left sidebar shows the pages your role can reach. On mobile, use the bottom tab bar (Dashboard / Spaces / Operations / Keys / More) or open the hamburger menu in the top-left for the full list.',
      },
      {
        question: 'How do I switch between light and dark mode?',
        answer:
          'Click the sun/moon icon in the top header (desktop). On mobile, the toggle lives inside your Profile page under Settings. Your preference is saved across devices.',
      },
      {
        question: 'How does global search work?',
        answer:
          'Admins have a search button in the header (also opens with ⌘K / Ctrl+K). It searches across rooms, issues, supplies, and people. Type a few characters — results live-update as you type.',
        roles: ADMINS,
      },
      {
        question: 'Where do breadcrumbs go?',
        answer:
          'The breadcrumb strip under the header tells you where you are in a feature (e.g., Dashboard → Spaces → Building → Floor → Room). Click any segment to go back to it.',
      },
      {
        question: 'Why does the layout change between desktop and mobile?',
        answer:
          'Tables become cards; the sidebar collapses into a hamburger; some controls move into a bottom sheet. Same data, just sized for the screen. If something looks cut off, swipe horizontally — most strips scroll.',
      },
    ],
  },

  // ─── 3. Your profile & home room ────────────────────────────────────────
  {
    id: 'profile',
    title: 'Your profile & home room',
    icon: User,
    blurb: 'Fill these out once and the rest of the app gets easier.',
    items: [
      {
        question: 'Where is my profile?',
        answer:
          'Click your avatar in the top-right corner. The Profile page has tabs for personal info, your assigned room (Home room), notification preferences, and security settings.',
      },
      {
        question: 'What is a "home room" and why does it matter?',
        answer:
          'It\'s the room you sit in. Supply orders default to your home room as the delivery location; the issue report wizard pre-fills it as the location. Set it under Profile → "My Room" and you stop having to type it every time.',
      },
      {
        question: 'Who can change my role?',
        answer:
          'Only a System Admin (via Admin Center → Users). Some job titles auto-assign a matching role on signup; otherwise ask an admin to bump you.',
      },
      {
        question: 'I just got approved or my role changed — why am I still seeing the old menu?',
        answer:
          'Permissions cache for 5 minutes. Sign out and back in, or hard-refresh the page, to pull the new permissions immediately.',
      },
    ],
  },

  // ─── 4. Submitting requests ─────────────────────────────────────────────
  {
    id: 'requests',
    title: 'Submitting requests',
    icon: Inbox,
    blurb: 'How to order, report, and ask for help.',
    items: [
      {
        question: 'How do I order supplies?',
        answer:
          'Hit "+ New" in the header → "Order Supplies" (or go to /supplies and pick the Order tab). Search the catalog, tap "Add" on items to put them in your cart, then open the cart from the floating "Review N items" button. Pick a delivery room (defaults to your home room), set priority, and submit. The cart shows pack sizes and totals as you add.',
      },
      {
        question: 'Why is the Submit button greyed out?',
        answer:
          'Most often: no delivery location selected. The Submit button reads "Add a delivery location to submit" until you pick a room. Some items also need a justification ("Requires approval" badge) or a personal access code for large quantities — the cart tells you which.',
      },
      {
        question: 'What is an "access code" on large orders?',
        answer:
          'Some items (e.g., a full case of batteries) need a supervisor-level confirmation before they leave the supply room. Your supervisor sets a personal 4-digit code on your profile; type it into the cart when prompted. Admins/court_officer/court_liaison bypass automatically.',
      },
      {
        question: 'How do I report a facility issue (broken door, leak, etc.)?',
        answer:
          'Non-admin roles: tap "Report Issue" in the top header (or the floating "+" on mobile → Report Issue). Admins/facilities managers: Operations page → Issues tab → "Report" button (the header button is hidden for you to avoid two paths). Pick the room, issue type, urgency, and add a description or photo.',
      },
      {
        question: 'How do I report a lighting problem?',
        answer:
          'Use "+ New" → "Report Lighting", or go directly to /lighting/report. You can pick the room, mark which fixtures are out, and note bulb type / ceiling access if you know them. These reports auto-populate the room\'s lighting profile so future requests already know what kind of bulb fits.',
      },
      {
        question: 'How do I request a key?',
        answer:
          'Use "+ New" → "Request a Key" (route: /keys/request). Goes to the Facility Coordinator for approval. If the app is down, email the facility office directly — they have the same intake form on paper.',
      },
      {
        question: 'What\'s the difference between "Order Supplies" and "Make a Request"?',
        answer:
          '"Order Supplies" pulls items from inventory (e.g., pens, paper, batteries). "Make a Request" covers everything that needs a person to do something — set up a room, move furniture, schedule a delivery, etc. Both land in /my-requests when submitted.',
      },
    ],
  },

  // ─── 5. Tracking your requests ──────────────────────────────────────────
  {
    id: 'tracking',
    title: 'Tracking your requests',
    icon: ListChecks,
    blurb: 'What the statuses mean and where to find them.',
    items: [
      {
        question: 'Where do I see what I\'ve submitted?',
        answer:
          'Open "My Requests" from your sidebar (or /my-requests directly). One page lists everything you\'ve filed — supply orders, key requests, lighting reports, tasks. Filter by type or status if the list gets long.',
      },
      {
        question: 'What do supply order statuses mean?',
        answer:
          'Submitted → received, in the queue. Pending approval → has a flagged item, waiting on a supervisor. Approved → cleared, will be picked next. Picking → court aide is gathering the items. Ready → wait for pickup or delivery. Completed → delivered to you. Cancelled / Rejected → not happening, with a note explaining why.',
      },
      {
        question: 'What do issue statuses mean?',
        answer:
          'Open → seen, not yet worked on. In Progress → assigned, someone is on it. Resolved → fixed, recorded. There is no "Closed" — Resolved is final. Critical priority issues skip the regular queue and ping admins immediately.',
      },
      {
        question: 'How do notifications work?',
        answer:
          'The bell icon shows unread updates. You get a notification when an issue you reported changes status, gets assigned, or gets a note; when a supply order moves to Approved / Picking / Ready / Completed; and when an admin replies to a request. Updates push in real time — no refresh needed.',
      },
      {
        question: 'Why didn\'t I get notified about something?',
        answer:
          'Three usual reasons: (1) the notification is in the bell archive at /notifications (read it once and it leaves the dropdown), (2) your browser blocked notifications — check site settings, (3) the change was made by you, in which case the system intentionally doesn\'t notify the actor.',
      },
    ],
  },

  // ─── 6. Spaces / rooms (admin/FM) ───────────────────────────────────────
  {
    id: 'spaces',
    title: 'Spaces & rooms',
    icon: Building2,
    blurb: 'Manage the physical inventory: buildings, floors, rooms.',
    items: [
      {
        question: 'How do I filter to one building or floor?',
        answer:
          'Two new selectors at the top of the Rooms page: Building, then Floor (Floor narrows to the chosen building). Selection writes to the URL (?building=&floor=) so you can bookmark or share a scoped view.',
        roles: ADMIN_FM,
      },
      {
        question: 'How do I add a new room?',
        answer:
          'Spaces → "Add Room" (top of the list, admin/system_admin/facilities_manager only). Pick building + floor, then enter the room number, name, type, and any notes. You can also import from Excel using the buttons on the right.',
        roles: ADMIN_FM,
      },
      {
        question: 'How do I edit a room?',
        answer:
          'Click any room in the sidebar list to open it in the detail panel. The pencil icon opens the editor — change name, room number, type, capacity, accessibility flags, and add photos. Saves are atomic; you can close anytime.',
        roles: ADMIN_FM,
      },
      {
        question: 'What\'s the difference between Spaces and the Courtrooms directory?',
        answer:
          'Spaces (/spaces) is the full operational inventory — every room, including offices, lockers, storage. The Courtrooms directory (/courtrooms) is read-only and filtered to just courtrooms, with photos, judge/clerk assignments, and capacity. Court officers and other non-admin roles use the directory; admins manage everything in Spaces.',
      },
      {
        question: 'A room is showing the wrong type — can I fix that?',
        answer:
          'Yes. Open the room → editor → Room type. The dropdown lists all valid types (office, courtroom, chamber, storage, locker rooms, etc.). Changing the type updates filtering across the app.',
        roles: ADMIN_FM,
      },
      {
        question: 'Can I add photos to a room?',
        answer:
          'Yes. In the room editor, scroll to Photos. Two galleries: judge view and audience view (for courtrooms). Drag-drop or browse to upload. They\'re visible on the Courtrooms directory.',
        roles: ADMIN_FM,
      },
    ],
  },

  // ─── 7. Operations (issues / maintenance / lighting) ────────────────────
  {
    id: 'operations',
    title: 'Operations',
    icon: AlertTriangle,
    blurb: 'Work through issues, schedule maintenance, track lighting.',
    items: [
      {
        question: 'How do I work through pending issues?',
        answer:
          'Operations → Issues tab. Use the filter bar to narrow by building, status, priority, or assignee. Click any issue to open the detail drawer; change status (Open → In Progress → Resolved), assign someone, add notes, and attach photos. The list refreshes in real time when anyone updates.',
        roles: ADMIN_FM,
      },
      {
        question: 'How do I schedule maintenance?',
        answer:
          'Operations → Maintenance tab → "Schedule". Pick the room, type of work, dates, and assignee. Recurring jobs (paint, deep clean, HVAC) repeat on the cadence you set and show in the calendar view.',
        roles: ADMIN_FM,
      },
      {
        question: 'What is the "Pending DCAS Handoff" panel?',
        answer:
          'Painting, shampooing, and similar work goes to an outside vendor (DCAS), not internal staff. The panel on the Maintenance tab lists scheduled DCAS jobs that haven\'t been filed yet, so you don\'t forget to notify them. Click "Log it" to record the ticket number once filed; the row turns green and drops out of the pending list.',
        roles: ADMIN_FM,
      },
      {
        question: 'How do I move a judge to a different chamber?',
        answer:
          'Court Operations (/term-sheet) → Personnel → "Chambers Move Planner". The planner splits prep work between DCAS items (paint/shampoo) and internal staff tasks (move furniture, deliver supplies). Set the target date and it generates the work items for both lanes automatically.',
        roles: COURT_OPS,
      },
      {
        question: 'How do I review lighting issues?',
        answer:
          'Operations → Lighting tab. Three sub-tabs: Issues (queue from users), Coverage (LED conversion progress by building), Rooms (per-room fixture tables with bulb type / ceiling access / status). Click any row to drill in.',
        roles: ADMIN_FM,
      },
    ],
  },

  // ─── 8. Keys & lockboxes ────────────────────────────────────────────────
  {
    id: 'keys',
    title: 'Keys & lockboxes',
    icon: KeyRound,
    blurb: 'Track who has what key, lockbox by lockbox.',
    items: [
      {
        question: 'Where do I see what\'s in each lockbox?',
        answer:
          'Keys page → Lockbox tab (default). Each slot shows the key, who it\'s linked to, and current status (Available with a green dot / Checked Out with an amber rail / Missing with a red rail). Use the "Needs attention" filter to jump straight to the slots that need action.',
        roles: KEY_HANDLERS,
      },
      {
        question: 'How do I check a key out or back in?',
        answer:
          'Click the slot row, then the action button on the right (Check out / Check back in). The status pill updates immediately and the activity log records who, when, and to whom. A note field lets you add context (e.g., "borrowed for off-site meeting").',
        roles: KEY_HANDLERS,
      },
      {
        question: 'How do I issue a new key from inventory?',
        answer:
          'Keys page → Inventory tab → pick a key type → "Issue". Assign to a person, note the purpose, and optionally link to a lockbox slot for ongoing tracking.',
        roles: KEY_HANDLERS,
      },
      {
        question: 'A key is missing — what now?',
        answer:
          'Open the slot, set status to Missing, add notes. The slot turns red. Then email the facility office to start the replacement key process. The audit log keeps the history regardless of what status you set.',
        roles: KEY_HANDLERS,
      },
    ],
  },

  // ─── 9. Court Operations ────────────────────────────────────────────────
  {
    id: 'court-ops',
    title: 'Court Operations',
    icon: Gavel,
    blurb: 'Term sheets, courtroom assignments, daily sessions.',
    items: [
      {
        question: 'Where do I see today\'s assignments?',
        answer:
          'Term Sheet (/term-sheet). The grid shows every courtroom with its judge, clerks, and current status (in session / adjourned / dark). Filter by date or part.',
        roles: ['admin', 'system_admin', 'facilities_manager', 'court_liaison', 'standard', 'court_aide', 'court_officer', 'purchasing'],
      },
      {
        question: 'How do I swap two judges between rooms?',
        answer:
          'Term Sheet → Personnel → "Swap Courtrooms" (admin/court_liaison only). Pick the two rooms; the system reassigns both judges and their clerks atomically, with the change recorded in the audit log.',
        roles: COURT_OPS,
      },
      {
        question: 'How do I upload a new term?',
        answer:
          'Term Sheet → "Upload Term" → drop the PDF. The parser pulls parts/judges/clerks and shows a preview before you commit. If something is missing or wrong, edit it in the preview — only the corrected version is saved.',
        roles: COURT_OPS,
      },
      {
        question: 'Why can\'t I edit the term sheet?',
        answer:
          'Edit rights belong to admins and court_liaison only. Other roles see a read-only view. If you spot a wrong assignment, message your court_liaison — they can fix it in one click.',
      },
      {
        question: 'How do I track a courtroom shutdown?',
        answer:
          'Court Operations → Shutdowns. Pick the room, the reason, and the expected return date. The room marks as "Under maintenance" across the app (Spaces, Operations, Term Sheet) until you close the shutdown.',
        roles: ADMIN_FM,
      },
      {
        question: 'Which courtrooms have bunting on the tables right now?',
        answer:
          'Courtrooms (/courtrooms). Rooms with bunting set up glow gold, carry a "Bunting" badge, and sort to the top of the directory, with a count in the header — no need to walk the floors to check.',
      },
      {
        question: 'How do I mark bunting as set up or removed?',
        answer:
          'Open the room in the Courtrooms directory and use the "Mark has bunting" / "Mark removed" toggle in the detail view. Court officers and sergeants can flip this themselves — it only changes the bunting flag, nothing else about the room.',
        roles: ['admin', 'system_admin', 'facilities_manager', 'court_liaison', 'court_officer'],
      },
    ],
  },

  // ─── 10. Inventory & Supply Room ────────────────────────────────────────
  {
    id: 'inventory',
    title: 'Inventory & Supply Room',
    icon: Package2,
    blurb: 'For the staff that fulfills supply orders and manages stock.',
    items: [
      {
        question: 'How do I fulfill a supply request (court aide workflow)?',
        answer:
          'Work Center or Supply Room page → pick up an approved request → status moves Submitted → Picking → Ready → Completed. Mark items picked as you grab them; the requester sees status updates in real time and gets a notification at each step.',
        roles: ['admin', 'system_admin', 'facilities_manager', 'court_aide'],
      },
      {
        question: 'How do I add or edit an inventory item?',
        answer:
          'Inventory page → "Add Item" (or the pencil on an existing row). Required: name, smallest unit (e.g., "battery"). Recommended: pack size + packaging note (e.g., 4 batteries per pack) so orderers know whether "1" means one battery or one pack of four. Toggle "Requires approval" to flag items that need a supervisor sign-off.',
        roles: SUPPLY_STAFF,
      },
      {
        question: 'Why do non-admin users see "in stock / low / out" instead of exact counts?',
        answer:
          'Raw stock numbers are admin-only on purpose — they tend to cause panic ordering. The user-facing supply catalog reads from a view (inventory_catalog) that exposes only a derived status. The Inventory page (admin) still shows exact quantities.',
        roles: SUPPLY_STAFF,
      },
      {
        question: 'What is the "order_code_threshold" field?',
        answer:
          'Per-item large-order limit. If anyone orders at or above the threshold (e.g., 25 batteries when the threshold is 24), the cart asks for the orderer\'s personal access code before submit. Supervisors bypass. Set this on items where bulk orders need oversight.',
        roles: SUPPLY_STAFF,
      },
      {
        question: 'How do I do an inventory audit?',
        answer:
          'Inventory → "Audit" (top right). Pick the items to count, enter actual on-hand quantity per item, and submit. Differences write to inventory_item_transactions so the trail is permanent.',
        roles: SUPPLY_STAFF,
      },
    ],
  },

  // ─── 11. Admin tools ────────────────────────────────────────────────────
  {
    id: 'admin-tools',
    title: 'Admin tools',
    icon: ShieldCheck,
    blurb: 'For system administrators only.',
    items: [
      {
        question: 'How do I approve a pending user?',
        answer:
          'Admin Center → Users tab. Pending accounts show at the top with a yellow chip. Open the row, verify the email and requested role, then click Approve. The user gets an email and can sign in immediately. Reject sends them to /auth/account-rejected.',
        roles: ADMINS,
      },
      {
        question: 'How do I preview the app as a different role?',
        answer:
          'Press Ctrl+Shift+D (or Cmd+Shift+D on macOS) to open the DevMode panel. Pick a role — the sidebar, header, and dashboard immediately switch to what that role would see. "Reset to Real Role" restores you. Your real role is unchanged; preview is client-side only. A yellow banner reminds you when preview is active.',
        roles: ADMINS,
      },
      {
        question: 'How do I assign a supply order code to a user?',
        answer:
          'Admin Center → Users → row menu → "Set order code". Enter a 4-digit code (stored hashed); the user types it into the cart when prompted on large orders. Use the same row menu to clear or rotate the code.',
        roles: ADMINS,
      },
      {
        question: 'What does the "bypass order code" toggle do?',
        answer:
          'Skip the access-code prompt entirely for a single user (typically a supervisor). Admin Center → Users → row menu. Use sparingly; the audit log still records who ordered what.',
        roles: ADMINS,
      },
      {
        question: 'Where are routing rules and form templates?',
        answer:
          'Admin → "Routing Rules" controls which form-submission types route to which approver pools. "Form Builder" lets you create new form templates without writing code. Both are system_admin-only.',
        roles: ADMINS,
      },
    ],
  },

  // ─── 12. Mobile use ─────────────────────────────────────────────────────
  {
    id: 'mobile',
    title: 'On mobile',
    icon: Smartphone,
    blurb: 'Tips for using the app on a phone or tablet.',
    items: [
      {
        question: 'How do I open the full menu on mobile?',
        answer:
          'Tap the hamburger icon in the top-left header. The bottom tab bar covers the four most-used pages plus "More" for everything else.',
      },
      {
        question: 'What is the floating "+" button?',
        answer:
          'Quick-action menu for the most common requests (Order Supplies, Make a Request, Request a Key). It hides on pages where it would duplicate an existing button (e.g., on /supplies itself).',
      },
      {
        question: 'Why are some tab strips cut off on the right edge?',
        answer:
          'They scroll horizontally — swipe left to see more options (e.g., the "Missing" status filter on Keys, the "Furniture" / "Miscellaneous" categories on Supplies). The scroll indicator is hidden to keep the bar clean.',
      },
      {
        question: 'Can I install the app to my home screen?',
        answer:
          'Yes — it\'s a PWA. On iOS Safari: Share → Add to Home Screen. On Android Chrome: ⋮ menu → Install app. The icon launches without browser chrome, so it feels like a native app.',
      },
    ],
  },

  // ─── 13. Notifications & history ────────────────────────────────────────
  {
    id: 'notifications',
    title: 'Notifications & history',
    icon: Bell,
    blurb: 'How updates flow and where the archive lives.',
    items: [
      {
        question: 'Where do I see notifications?',
        answer:
          'The bell icon in the header opens your unread notifications. A full archive lives at /notifications. Updates push in real time — no refresh needed.',
      },
      {
        question: 'What triggers a notification?',
        answer:
          'Status changes on issues you reported (open → in progress → resolved). Supply order checkpoints (approved, picking, ready, completed). Replies to requests. Admins also get pending-approval alerts and critical-priority pings.',
      },
      {
        question: 'Can I turn off specific notification types?',
        answer:
          'Not yet — all notifications are on by default. The Profile → Settings tab will eventually have category toggles. For now, mark messages as read in the bell archive to clear the unread badge.',
      },
    ],
  },

  // ─── 14. Troubleshooting ────────────────────────────────────────────────
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: LifeBuoy,
    blurb: 'Common problems and how to fix them.',
    items: [
      {
        question: 'I get "Access restricted" on a page I expected to see',
        answer:
          'Your role doesn\'t have access to that module. Hit Go Back and check your sidebar — those are the pages you can reach. If you think the restriction is wrong, ask an admin (Admin Center → Users) to update your role.',
      },
      {
        question: 'The page is just spinning / stuck loading',
        answer:
          'Hard-refresh (Cmd/Ctrl + Shift + R) to clear the cached permissions and route data. If that doesn\'t help, sign out and back in. If the spinner persists after a full reload, copy what\'s in the browser console and email facilities support.',
      },
      {
        question: 'My delivery location won\'t save / supply order won\'t submit',
        answer:
          'Make sure you picked a room from the dropdown — typing a free-text room name doesn\'t count, and the Submit button stays disabled until a valid selection is in. If your home room is missing from your profile, the cart starts blank; set it under Profile → My Room.',
      },
      {
        question: 'A button does nothing when I tap it on mobile',
        answer:
          'Try once more — animations occasionally leave an invisible overlay for a tenth of a second after a sheet closes. If a button stays unresponsive after two taps and the cart isn\'t open, refresh the page.',
      },
      {
        question: 'I clicked a link in an email and it took me to /login',
        answer:
          'Expected — protected pages bounce to /login when you\'re signed out. Sign in and you\'ll be sent back to the original destination.',
      },
      {
        question: 'Where do I get help that\'s not here?',
        answer:
          'Use the AI chat bubble in the bottom-left for instant answers about how to do something in the app. For account issues or anything urgent, email the facility support address listed in the footer.',
      },
    ],
  },
];

/**
 * Filter guides + items by role. Items without a `roles` list show to everyone.
 * Sections that filter down to zero items are dropped.
 */
export function filterGuidesForRole(
  sections: GuideSection[],
  role: UserRole | null,
): GuideSection[] {
  if (!role) return sections;
  return sections
    .filter((s) => !s.roles || s.roles.includes(role))
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
    }))
    .filter((s) => s.items.length > 0);
}
