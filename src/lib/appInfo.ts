/**
 * Single source of truth for app identity, creator, and support info.
 * Import from here everywhere — never hardcode these strings in UI components.
 *
 * ⚠️  BEFORE GO-LIVE: Create the Gmail account below at https://gmail.com
 *     then forward it to wherever you check email.
 */
export const APP_INFO = {
  name:         'NYSC Facilities Hub',
  fullName:     'New York State Court Facilities Management System',
  version:      '1.0.0',
  createdYear:  2024,
  updatedYear:  2026,
  organization: 'New York State Unified Court System',

  creator: {
    name:  'Jack Duchatelier',
    role:  'Developer & Designer',
  },

  support: {
    /**
     * ⚠️  Register this address before deploying to users.
     *     Suggested: create nyscfacilitieshub@gmail.com on Gmail,
     *     then enable "Send mail as" forwarding to your main inbox.
     */
    email:        'nyscfacilitieshub@gmail.com',
    emailSubject: 'NYSC Facilities Hub — Support Request',
    emailHref:    'mailto:nyscfacilitieshub@gmail.com?subject=NYSC%20Facilities%20Hub%20%E2%80%94%20Support%20Request',
  },
} as const;

/** Pre-formatted copyright line for footers */
export const APP_COPYRIGHT =
  `© ${APP_INFO.createdYear}–${APP_INFO.updatedYear} ${APP_INFO.creator.name} · ${APP_INFO.organization}`;
