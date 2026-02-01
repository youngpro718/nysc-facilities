
# Fix "Set up a room" Flow

## What's Wrong

When you click "Set up a room" on the Help Request page, you get:
1. A generic text box instead of a structured form
2. No confirmation that your request actually went through
3. No clear way to track your submitted request
4. Back button confusion (multiple navigation layers)

## The Fix

### 1. Add Structured Form for Room Setup
Instead of just a text area, the "Set up a room" option will show:
- **Room selector** - Pick which room needs setup (dropdown with your assigned rooms or manual entry)
- **Date needed** - When is this setup required?
- **Number of people** - How many will attend?
- **Setup type** - Meeting, Hearing, Training, Event, Other
- **Special notes** - Any additional requirements

### 2. Better Success Confirmation
After submitting:
- Show exactly what was requested (room, date, type)
- Auto-navigate to "My Activity → Tasks" after 3 seconds
- Toast notification confirming "Request submitted!"

### 3. Simpler Navigation
- Back button on Step 1 goes to previous page (user dashboard) not Request Hub
- After submission, one-click to view your requests

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/request/HelpRequestPage.tsx` | Add structured setup form, improve success UX, fix back navigation |

## Technical Changes

```
HelpRequestPage.tsx
├── Add new state for structured setup fields
│   ├── roomId (string)
│   ├── dateNeeded (Date)  
│   ├── attendeeCount (number)
│   └── setupType (meeting/hearing/etc)
├── Conditional render: if task_type === 'setup' → show structured form
├── Compose structured title: "Room 201 Setup - Meeting for 12 people"
├── On success: navigate to /my-activity?tab=tasks after delay
└── Back button: navigate(-1) instead of navigate('/request')
```

## What You'll See After Fix

1. Click "Set up a room" → See structured form with room picker, date, attendee count
2. Fill out fields → Submit → See confirmation with your request details
3. Automatically taken to My Activity where your request is visible
4. Back button always goes to where you came from
