/**
 * App changelog — newest entry first. The FIRST entry's version is the
 * app's current version (APP_INFO.version reads it from here), so shipping
 * a new iteration means adding one entry to the top of this list.
 *
 * Keep highlights in plain language — users read this in the "What's New"
 * dialog opened from the version number in the footer.
 */
export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  title?: string;
  highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-07-20",
    title: "Notifications overhaul, maintenance workbench fix, and a big bug-fix pass",
    highlights: [
      "Notifications: honest unread count, less noise, items auto-mark-read, and a new attention strip for what needs you.",
      "Fixed critical-priority issues being invisible in the Operations queue, dashboard alert banner, and timeline icons.",
      "Fixed the Maintenance workbench showing zero/empty even when real issues existed — reported issues now show up correctly under In Progress, Open, Urgent, and Completed.",
      "Fixed the Edit Issue form always failing to save, and photo attach not responding on Report Issue / Quick Report.",
      "Operations page: removed the calendar bloat pushing content down the page, fixed the sticky tab bar.",
      "Sign-up no longer lets new users pick their own role — everyone starts as a standard user until an admin assigns one.",
      "Added per-admin dismiss/rotate for building dashboard issue photos.",
      "Simple List Excel export now groups by building then floor and includes a cooler total row.",
      "Added shared vestibule and egress room types; polished the room list.",
      "The app now checks for updates when you return to the tab, not just on an hourly timer.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-16",
    title: "Common areas everywhere + version tracking",
    highlights: [
      "Water Coolers filter now shows cooler-equipped common areas (hallways, lobbies, mezzanines) right in the room list, highlighted in orange.",
      "Clicking a common area in the list shows its details in the side panel.",
      "The Simple List Excel export now includes common areas (orange rows), matching what's on screen.",
      "The full Excel export gained a read-only Common Areas sheet.",
      "New: this What's New panel — click the version number in the footer any time to see what changed.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-09",
    title: "Initial release",
    highlights: [
      "Facility management for NYSC: rooms, spaces, keys, lighting, and occupants.",
      "Supply room with catalog ordering, fulfillment workflow, and email receipts.",
      "Issue reporting with photos, urgency, and notifications.",
      "Term sheet with the official printable format and offline pocket copy.",
      "Role-based dashboards for admin, court aides, purchasing, officers, and staff.",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
