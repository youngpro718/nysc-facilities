# Sanitized Network Failures

Captured during authenticated exploratory testing on June 20, 2026.

Raw HAR data was intentionally removed because it contained authenticated request headers.

## Key requests

```text
404 GET /rest/v1/key_requests
```

Observed twice after opening the administrator's Keys → Requests tab. A user key-request POST also returned 404 earlier in the pass.

## Scheduled maintenance list

```text
400 GET /rest/v1/maintenance_schedules
        ?select=*,rooms:space_id(name,room_number)
        &order=scheduled_start_date.asc
```

The calendar's plain maintenance query returned 200, while the list query containing the room relationship returned 400.

## General facilities request

```text
POST /rest/v1/staff_tasks
Error: Could not find the 'room_id' column of 'staff_tasks' in the schema cache
```

## Inventory delete

```text
409 DELETE /rest/v1/inventory_items
```

The UI closed the confirmation without showing an error and left the referenced item in place.
