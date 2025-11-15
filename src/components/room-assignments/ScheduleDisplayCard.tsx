import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

interface ScheduleDisplayCardProps {
  schedule: string;
  assignmentType: string;
  roomNumber: string;
  className?: string;
}

export function ScheduleDisplayCard({ 
  schedule, 
  assignmentType, 
  roomNumber,
  className 
}: ScheduleDisplayCardProps) {
  const parseSchedule = (scheduleStr: string) => {
    try {
      // Handle different schedule formats
      if (scheduleStr.includes('-')) {
        // Time range format like "9:00 AM - 5:00 PM"
        const [start, end] = scheduleStr.split('-').map(s => s.trim());
        return {
          type: 'time_range',
          start: start,
          end: end,
          display: `${start} - ${end}`
        };
      } else if (scheduleStr.includes(',')) {
        // Multiple days/times format
        const parts = scheduleStr.split(',').map(s => s.trim());
        return {
          type: 'multiple',
          parts: parts,
          display: parts.join(', ')
        };
      } else if (scheduleStr.toLowerCase().includes('hour')) {
        // After hours format
        return {
          type: 'special',
          display: scheduleStr,
          variant: 'after_hours'
        };
      } else {
        // Default format
        return {
          type: 'simple',
          display: scheduleStr
        };
      }
    } catch (error) {
      return {
        type: 'simple',
        display: scheduleStr
      };
    }
  };

  const scheduleInfo = parseSchedule(schedule);

  const getScheduleColor = (type: string) => {
    switch (type) {
      case 'time_range':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'multiple':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      case 'special':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'primary_office':
        return <MapPin className="h-4 w-4" />;
      case 'shared_space':
        return <Users className="h-4 w-4" />;
      case 'temporary':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatAssignmentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {getAssignmentTypeIcon(assignmentType)}
          <span>{formatAssignmentType(assignmentType)}</span>
          <Badge variant="outline" className="ml-auto">
            Room {roomNumber}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`
          p-3 rounded-lg border text-sm font-medium
          ${getScheduleColor(scheduleInfo.type)}
        `}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{scheduleInfo.display}</span>
          </div>
          
          {scheduleInfo.type === 'time_range' && scheduleInfo.start && scheduleInfo.end && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs opacity-75">
              <div>Start: {scheduleInfo.start}</div>
              <div>End: {scheduleInfo.end}</div>
            </div>
          )}
          
          {scheduleInfo.type === 'multiple' && scheduleInfo.parts && (
            <div className="mt-2 space-y-1">
              {scheduleInfo.parts.map((part, index) => (
                <div key={index} className="text-xs opacity-75">
                  • {part}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}