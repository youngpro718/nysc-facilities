
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, X, CheckSquare, Square, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RoomType } from '@/components/spaces/rooms/types/RoomTypes';

interface PropertiesPanelProps {
  selectedObject: any;
  onUpdate: () => void;
  onPreviewChange?: (values: Record<string, unknown>) => void;
}

export function PropertiesPanel({ 
  selectedObject, 
  onUpdate,
  onPreviewChange
}: PropertiesPanelProps) {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  
  // Reset local values when selected object changes
  useEffect(() => {
    if (selectedObject) {
      setLocalValues({
        positionX: selectedObject.position?.x.toString() || '0',
        positionY: selectedObject.position?.y.toString() || '0',
        width: selectedObject.size?.width.toString() || '100',
        height: selectedObject.size?.height.toString() || '100',
        rotation: selectedObject.rotation?.toString() || '0',
        room_number: selectedObject.properties?.room_number || '',
        room_type: selectedObject.properties?.room_type || '',
        status: selectedObject.properties?.status || 'active',
      });
    } else {
      setLocalValues({});
    }
  }, [selectedObject]);

  // Handle live preview as values change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const newValues = { ...localValues, [name]: value };
    setLocalValues(newValues);
    
    // Only trigger preview change if the callback exists
    if (onPreviewChange) {
      onPreviewChange(newValues);
    }
  };
  
  const getObjectTypeLabel = (type: string) => {
    switch (type) {
      case 'room':
        return (
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            Room
          </Badge>
        );
      case 'hallway':
        return (
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
            Hallway
          </Badge>
        );
      case 'door':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:text-amber-400 border-amber-200">
            Door
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {type}
          </Badge>
        );
    }
  };

  const getRoomTypeLabel = (roomType: string) => {
    if (!roomType) return '';
    
    const typeMap: Record<string, string> = {
      'office': 'Office',
      'meeting': 'Meeting Room',
      'storage': 'Storage',
      'restroom': 'Restroom',
      'utility': 'Utility',
      'courtroom': 'Courtroom',
      'chamber': 'Chamber',
      'jury_room': 'Jury Room',
      'conference_room': 'Conference Room',
      'filing_room': 'Filing Room'
    };
    
    return typeMap[roomType] || roomType;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
      case 'under_maintenance':
        return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">Under Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!selectedObject) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="text-gray-400 mb-2">
              <Edit2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Select an object to view or edit its properties</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <CardTitle className="text-lg font-semibold">Properties</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getObjectTypeLabel(selectedObject.type)}
                {selectedObject.properties?.room_number && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    #{selectedObject.properties.room_number}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocalValues({})}
            className="h-8 w-8 rounded-full hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6 px-4">
        {/* Basic Properties */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Basic Information</h3>
          </div>
          
          {selectedObject.type === 'room' && selectedObject.properties?.room_number && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Room Number</Label>
              <div className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-1">{selectedObject.properties.room_number}</div>
            </div>
          )}
          
          {selectedObject.type === 'room' && selectedObject.properties?.room_type && (
            <div className="mb-3">
              <Label className="text-xs text-gray-500">Room Type</Label>
              <div className="font-medium">{getRoomTypeLabel(selectedObject.properties.room_type)}</div>
            </div>
          )}
          
          {selectedObject.properties?.status && (
            <div className="mb-3">
              <Label className="text-xs text-gray-500">Status</Label>
              <div>{getStatusBadge(selectedObject.properties.status)}</div>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Physical Properties */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="w-1 h-4 bg-green-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Physical Properties</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Position X</Label>
              <div className="relative">
                <Input 
                  name="positionX"
                  value={localValues.positionX || ''}
                  onChange={handleInputChange}
                  className="pr-8 font-mono text-sm"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Position Y</Label>
              <div className="relative">
                <Input 
                  name="positionY"
                  value={localValues.positionY || ''}
                  onChange={handleInputChange}
                  className="pr-8 font-mono text-sm"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Width</Label>
              <div className="relative">
                <Input 
                  name="width"
                  value={localValues.width || ''}
                  onChange={handleInputChange}
                  className="pr-8 font-mono text-sm"
                  placeholder="100"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Height</Label>
              <div className="relative">
                <Input 
                  name="height"
                  value={localValues.height || ''}
                  onChange={handleInputChange}
                  className="pr-8 font-mono text-sm"
                  placeholder="100"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Rotation</Label>
            <div className="relative">
              <Input 
                name="rotation"
                value={localValues.rotation || ''}
                onChange={handleInputChange}
                className="pr-8 font-mono text-sm"
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">°</span>
            </div>
          </div>
        </div>
        
        {selectedObject.type === 'room' && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Room Properties</h3>
              <div className="mb-3">
                <Label className="text-xs text-gray-500">Room Number</Label>
                <Input 
                  name="room_number"
                  value={localValues.room_number || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="e.g. 101"
                />
              </div>
            </div>
          </>
        )}
        
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button 
            onClick={onUpdate} 
            className="w-full h-11 font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Properties
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
