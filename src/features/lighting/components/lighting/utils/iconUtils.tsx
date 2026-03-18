import React from 'react';
import { Lightbulb, ShieldAlert, Radar } from "lucide-react";

export const getTypeIcon = (type: string): JSX.Element => {
  switch (type) {
    case 'emergency':
      return <ShieldAlert className="h-4 w-4 text-red-500" />;
    case 'motion_sensor':
      return <Radar className="h-4 w-4 text-blue-500" />;
    default:
      return <Lightbulb className="h-4 w-4 text-yellow-500" />;
  }
}; 