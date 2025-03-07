
import { useState, useEffect, useRef } from 'react';
import { createTooltipData } from '../utils/threeDUtils';

interface ObjectTooltipProps {
  object: any | null;
  position: { x: number, y: number } | null;
}

export function ObjectTooltip({ object, position }: ObjectTooltipProps) {
  const [tooltipData, setTooltipData] = useState<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (object) {
      const data = createTooltipData(object);
      setTooltipData(data);
    } else {
      setTooltipData(null);
    }
  }, [object]);
  
  // Don't render if no data or position
  if (!tooltipData || !position) return null;
  
  return (
    <div 
      ref={tooltipRef}
      className="absolute z-50 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200"
      style={{
        left: position.x + 10,
        top: position.y + 10,
        maxWidth: '250px',
        pointerEvents: 'none'
      }}
    >
      <h3 className="text-sm font-medium text-gray-900 mb-2">{tooltipData.title}</h3>
      <div className="space-y-1">
        {tooltipData.details.map((detail: any, index: number) => (
          <div key={index} className="grid grid-cols-2 text-xs">
            <span className="text-gray-500">{detail.label}:</span>
            <span className="text-gray-700 font-medium">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
