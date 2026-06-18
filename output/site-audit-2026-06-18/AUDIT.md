# NYSC Facilities visual audit

Captured June 18, 2026 at 1440 × 1000 from the local Vite application.

## Deliverables

- `current/` — 39 full-page screenshots covering distinct public, authentication, administrator, operations, court, supply, and profile screens.
- `current-contact-sheet.png` — representative nine-screen overview.
- Three generated redesign concepts shown in the Codex thread:
  1. Civic Editorial
  2. Operations Console
  3. Warm Institutional Modernist

## What currently reads as “AI-ish”

1. Nearly every information group is placed inside the same dark rounded card.
2. Blue buttons, blue active states, blue pills, and blue icon tiles compete for attention.
3. Equal-width metric cards and repeated grids make unrelated pages feel templated.
4. Typography is small and uniform, so headings, labels, metadata, and actions often have similar weight.
5. Large building-image cards consume prime dashboard space without helping the next operational decision.
6. Pills and badges are used for navigation, status, filtering, counts, and categories, weakening their meaning.
7. The floating support button overlaps content and adds another saturated blue element to every page.
8. Global “Order Supplies” and “Make a Request” controls appear even when they are not relevant to the current workflow.
9. Loading, empty, and populated screens use different visual grammars.
10. The current Inter/black/blue combination resembles a generic generated SaaS dashboard rather than a New York court operations product.

## Recommended direction

Use the **Operations Console** concept as the structural foundation, with typography and wayfinding details from **Civic Editorial**.

- Warm off-white or charcoal-neutral canvas instead of pure black.
- One restrained NYSC blue interaction color.
- Green, amber, and red reserved exclusively for operational state.
- Geist or a similarly precise humanist sans; tabular figures for metrics.
- Four-to-eight-pixel corner radius, minimal shadows.
- Ruled sections, tables, and work queues instead of cards for every group.
- Compact documentary building thumbnails rather than large hero cards.
- Contextual primary action per screen.
- Clear density tiers: page title, operational summary, work queue, supporting metadata.

## High-value first pass

1. Restyle the application shell and global tokens.
2. Redesign the Admin Dashboard as the reference screen.
3. Apply the same hierarchy to Operations, Tasks, Keys, and Inventory.
4. Simplify forms and public pages.
5. Standardize loading, empty, error, and success states.

## Coverage notes

- Legacy routes that redirect were captured at their final destination.
- The configured standard-user, court-aide, and CMC test credentials were no longer valid, so authenticated captures use the working administrator account.
- `/admin`, `/occupants`, and `/admin/supply-requests` showed inconsistent role-guard redirects during the audit and were excluded rather than mislabeled.
