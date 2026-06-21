# Exploratory User QA — June 20, 2026

## Outcome

The main supply-order, issue-reporting, task, inventory, room, profile, and maintenance-create workflows are usable. The connected database is not fully aligned with the current frontend, however. Four important surfaces fail or partially fail because expected tables, columns, or relationships are absent.

TypeScript checking and the production build both pass.

## Highest-priority findings

### 1. Key requests are visible but unusable

- The standard-user dashboard now includes a Request a Key dialog.
- Submitting it shows only `Could not submit the key request`.
- The request is not created.
- Both the user POST and admin Requests-tab GET return HTTP 404 for `key_requests`.
- Conclusion: the frontend feature exists, but migration/table deployment is missing in the connected database.

Evidence: `key-request-post-404.png` and `NETWORK_FAILURES.md`.

### 2. General facilities requests cannot be submitted

- Opened Make a Request, selected Room 1123, entered a description and requested date.
- Submission failed with:
  `Could not find the 'room_id' column of 'staff_tasks' in the schema cache`.
- Conclusion: the current form writes `room_id`, but the connected `staff_tasks` schema does not contain it.

Evidence: `make-request-missing-room-id.png`.

### 3. Standard-user supply access is blocked

- In User preview, both `/supplies?tab=order` and `/supplies?tab=request` resolve to `Access restricted`.
- The standard user therefore appears unable to reach the ordering/request UI from the intended role.
- The non-admin test credentials in `.env.local` are invalid, so this could not be confirmed with a real standard-user session.

Evidence: `standard-supplies-access-restricted.png`.

### 4. Scheduled Maintenance list is blank

- Creating a maintenance schedule succeeds and it appears on the calendar.
- The adjacent Scheduled Maintenance list renders its search/filter controls but no cards or empty/error state.
- Its query attempts `rooms:space_id(name,room_number)` and returns HTTP 400.
- The calendar query succeeds because it does not use that join.
- This also prevents editing or deleting the QA schedule from the visible list.

Evidence: `maintenance-list-join-400.png` and `NETWORK_FAILURES.md`.

### 5. New supply IDs still use eight-character hex codes

- A new order was submitted successfully as `#FDEA21EA`.
- The proposed daily sequence format is not active in the connected database/runtime.

### 6. Module access is still fetched during guarded navigation

- After clearing the browser request log, navigating from Dashboard to Inventory triggered another GET of `profiles.enabled_modules`.
- The data is not fully memoized across guarded route entry, so the underlying cause of the access-check flash remains.

## Other functional and UX findings

### Admin role preview is not a reliable impersonation tool

- User preview changes navigation and labels, but `/dashboard` redirects back to the real admin dashboard because the dashboard reads the authenticated profile role.
- Facilities Manager preview can still enter `/admin` because some guards use the real admin role.
- It is useful for visual review, but not for validating true authorization or the complete standard-user dashboard.

### Inventory deletion fails silently

- Created, edited, and stock-adjusted a QA inventory item successfully.
- Delete returned HTTP 409 after the item had stock-history references.
- The confirmation closed without an error toast; the item remained.

Remaining item:
`QA TEST Inventory Item 2026-06-20 — Edited`
(`030ba8da-b733-46cd-99bb-da6a3dcef7a3`)

### Issue location is inconsistent

- The issue was submitted with Room 1123.
- The admin table correctly displays Room 1123.
- User issue cards display `Unknown Building` for that issue and several older room-linked issues.

### My Requests exposes raw UUIDs as locations

- Several request cards show values such as `ea77794e-fd0f-4253-ab22-49a9d9a1689c` where a room/location label should appear.
- Mobile screenshot: `mobile-my-requests.png`.

### Add Room omits the room-number field

- The create dialog asks for Type, Name, Building, and Floor, but not Room Number.
- A new room initially duplicated its name into the card’s number/name presentation.
- Room Number can be added only afterward in Edit.
- The QA room was deleted successfully.

### Assign New Occupant is a dead-end workflow

- From the room edit wizard, Assign New Occupant navigates to `/occupants?room=...`.
- Unsaved wizard changes are abandoned without warning.
- The destination shows an access summary but no occupant-assignment control.

### Add Key has weak failure guidance

- A floor could be selected, but its Door dropdown was empty with no empty-state explanation.
- Submitting an incomplete form left the dialog open without visible field errors.

### Public Forms removal is incomplete

- `/admin/form-templates` redirects away.
- `/admin/routing-rules` remains live, including New Rule and JSON conditions.
- If “remove all traces” includes the old public-form administration infrastructure, more cleanup remains.

### Directory data still mixes room and floor concepts

- The Court Administration Directory Location column includes both values such as `Room 1600` and `17th Floor`.
- No legend explains the distinction.

### Duplicate personnel data

- The Term Sheet personnel list displayed duplicate `K. PAEK` entries.

### Mobile navigation remains button-based

- Desktop sidebar navigation is now composed of links.
- Mobile primary navigation still exposes Dashboard/Spaces/Operations/etc. as buttons rather than links.

## Accessibility findings

- Inventory Edit/Delete icon buttons have no accessible names.
- Room detail Edit/Delete/navigation icon buttons have no accessible names.
- Profile notification/analytics switches have no accessible names.
- Admin module-visibility switches have no accessible names.
- Elevator Pass fields include an unlabeled email textbox and placeholder-only fields.
- Lockbox Add Key Slot has unlabeled room and position controls.
- Bulk Add Chambers exposes many unlabeled checkboxes and spinbuttons.
- Maintenance schedule Edit/Delete icon buttons are also unlabeled in the source and inaccessible from the blank list.

The responsive Inventory tabs read correctly once each; the earlier doubled accessible names were not reproduced.

## Successful end-to-end workflows

- Supply order: create → start picking → mark ready → confirm pickup/completed.
- Issue: report → escalate → resolve.
- Task: create → cancel.
- Inventory: create → edit → adjust stock. Delete failure is documented above.
- Room: create → edit → add access item/note → delete.
- Maintenance: create and display on calendar. List/edit/delete failure is documented above.
- Profile: save existing profile values.
- Help Center: guides contain real topics and expandable articles.
- Mobile issue reporting uses the same unified form as desktop.

## Role and board coverage

- User preview: My Requests, Term Sheet, Notifications, Profile, Help; direct Keys and Inventory denial; supply denial. The User dashboard itself is blocked by the preview-role defect.
- Court Aide: Work Center, Tasks, Supply Room, Inventory, Term Sheet.
- Court Officer: Keys, My Issues, Courtrooms, Term Sheet, Profile.
- Purchasing: Supply Room, Inventory, Tasks, Profile.
- Court Liaison: Term Sheet, Supply Room, My Requests, Notifications, Profile, Operations.
- Facilities Manager: Dashboard, Spaces, Operations, Keys, Inventory, Tasks, Term Sheet, Profile.
- Administrator: Dashboard, Spaces, Operations, Keys/Kiosk, Inventory, Tasks, Court Operations, Admin Center, Help.

The configured User, Court Aide, and CMC test logins all returned `Invalid email or password`, so non-admin roles were exercised through the admin preview system.

## Previously reported items that now appear fixed

- SLA warnings and breaches are visible in Command Center and Supply Room.
- Direct navigation to Keys and Inventory is restricted for User preview.
- Desktop sidebar items are links.
- Footer/help email is `facilities-support@nycourts.gov`.
- Department is displayed as `Facilities`.
- Known test users are absent from the user list.
- Sample item-name spelling/casing/spacing is normalized.
- Inventory alert counts honor minimum quantity in tested examples.
- Work Center dates include the year and use a consistent format.
- Help Center contains articles.
- Tips no longer instruct users to hard-refresh.
- One admin-dashboard Refresh button was visible, with no duplicate reproduced.
- Low-contrast first paint was not reproduced during this pass.

## Forms exercised

Submitted where the action was safe:

- Supply order
- General request (failed)
- Key request (failed)
- Issue report
- Issue resolution
- Task creation and cancellation
- Inventory create/edit/stock adjustment/delete
- Room create/edit/access/note/delete
- Maintenance schedule creation
- Profile save

Filled and canceled to avoid changing real operational data:

- Routing rule
- Term Sheet Add Part / Start Next Term / Edit Assignment
- Key Personnel Add
- Chambers transition planner
- Elevator Pass issue and captain allocation
- Lockbox edit and Add Key Slot
- Bulk Add Chambers
- Add Key

## QA records left in the connected database

- Completed supply order `#FDEA21EA`.
- Resolved issue `Electrical Issue – 1123` (delete confirmation did not complete).
- Cancelled task `QA TEST — verify task creation workflow`.
- Scheduled maintenance `QA TEST — Room 1123 electrical inspection` (stranded by the list query failure).
- Inventory item `QA TEST Inventory Item 2026-06-20 — Edited` (delete returned 409).

All other potentially disruptive forms were canceled, and the temporary QA room was deleted.

## Verification

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Build warnings: sourcemap-location warnings for Select/Checkbox and large chunk warnings, including ExcelJS.

## Artifacts

- `NETWORK_FAILURES.md` — sanitized summary of the `key_requests` 404s, maintenance join 400, request schema error, and inventory 409.
- PNG screenshots in this directory document the principal failures and representative forms.
