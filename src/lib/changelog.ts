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
