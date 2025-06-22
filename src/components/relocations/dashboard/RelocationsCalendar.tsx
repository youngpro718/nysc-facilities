import { Calendar, momentLocalizer, Event as CalendarEvent } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useMemo } from 'react';
import { RoomRelocation } from '../types/relocationTypes';
import moment from 'moment';

const localizer = momentLocalizer(moment);

export interface RelocationsCalendarProps {
  relocations: RoomRelocation[];
}

export function RelocationsCalendar({ relocations }: RelocationsCalendarProps) {
  // Map relocations to calendar events
  const events = useMemo<CalendarEvent[]>(() =>
    relocations.map(r => ({
      id: r.id,
      title: `${r.original_room?.name || 'Unknown'} → ${r.temporary_room?.name || 'Unknown'} (${r.reason})`,
      start: new Date(r.start_date),
      end: new Date(r.end_date || r.start_date),
      allDay: true,
      resource: r,
    })),
    [relocations]
  );

  return (
    <div style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        tooltipAccessor="title"
        allDayAccessor="allDay"
        popup
        views={["month", "week", "day"]}
        defaultView="month"
        style={{ height: 600 }}
        eventPropGetter={(event) => {
          // Color by status
          const status = event.resource?.status;
          let bg = '#cbd5e1';
          if (status === 'active') bg = '#22c55e';
          if (status === 'scheduled') bg = '#facc15';
          if (status === 'completed') bg = '#3b82f6';
          if (status === 'cancelled') bg = '#ef4444';
          return { style: { backgroundColor: bg, color: '#111' } };
        }}
      />
    </div>
  );
}
