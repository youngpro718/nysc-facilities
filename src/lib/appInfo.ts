/**
 * Single source of truth for app identity, creator, and support info.
 * Import from here everywhere — never hardcode these strings in UI components.
 */
import { CURRENT_VERSION } from './changelog';

const supportEmail =
  import.meta.env.VITE_SUPPORT_EMAIL || 'facilities-support@nycourts.gov';
const supportSubject = 'NYSC Facilities Hub — Support Request';

export const APP_INFO = {
  name:         'NYSC Facilities Hub',
  fullName:     'New York State Court Facilities Management System',
  version:      CURRENT_VERSION,
  createdYear:  2024,
  updatedYear:  2026,
  organization: 'New York State Unified Court System',

  creator: {
    name:  'Jack Duchatelier',
    role:  'Developer & Designer',
  },

  support: {
    email: supportEmail,
    emailSubject: supportSubject,
    emailHref: `mailto:${supportEmail}?subject=${encodeURIComponent(supportSubject)}`,
  },
} as const;

/** Pre-formatted copyright line for footers */
export const APP_COPYRIGHT =
  `© ${APP_INFO.createdYear}–${APP_INFO.updatedYear} ${APP_INFO.creator.name} · ${APP_INFO.organization}`;
