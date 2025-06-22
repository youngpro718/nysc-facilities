import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room } from "@/components/spaces/types/RoomTypes";

interface PropertiesPanelProps {
  selectedObject: any;
  onUpdate: () => void;
  onPreviewChange?: (values: any) => void;
}

export function PropertiesPanel({ 
  selectedObject, 
  onUpdate,
  onPreviewChange
}: PropertiesPanelProps) {
  const [localValues, setLocalValues] = useState<any>({});
  
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
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Room
          </Badge>
        );
      case 'hallway':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Hallway
          </Badge>
        );
      case 'door':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
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
      'judges_chambers': 'Judge\'s Chambers',
      'jury_room': 'Jury Room',
      'conference_room': 'Conference Room',
      'filing_room': 'Filing Room'
    };
    
    return typeMap[roomType] || roomType;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
      case 'under_maintenance':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Under Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!selectedObject) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="text-md">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[500px] text-center">
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
    <Card className="h-[600px] overflow-y-auto">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-md flex items-center gap-2">
            {selectedObject.label || 'Properties'}
            {getObjectTypeLabel(selectedObject.type)}
          </CardTitle>
          {selectedObject.id && (
            <span className="text-xs text-gray-500 mt-1">ID: {selectedObject.id.substring(0, 8)}...</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setLocalValues({})}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Properties */}
        <div>
          <h3 className="text-sm font-medium mb-2">Basic Information</h3>
          
          {selectedObject.type === 'room' && selectedObject.properties?.room_number && (
            <div className="mb-3">
              <Label className="text-xs text-gray-500">Room Number</Label>
              <div className="font-medium">{selectedObject.properties.room_number}</div>
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
        <div>
          <h3 className="text-sm font-medium mb-2">Physical Properties</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs text-gray-500">Position X</Label>
              <Input 
                name="positionX"
                value={localValues.positionX || ''}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Position Y</Label>
              <Input 
                name="positionY"
                value={localValues.positionY || ''}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs text-gray-500">Width</Label>
              <Input 
                name="width"
                value={localValues.width || ''}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Height</Label>
              <Input 
                name="height"
                value={localValues.height || ''}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <Label className="text-xs text-gray-500">Rotation (degrees)</Label>
            <Input 
              name="rotation"
              value={localValues.rotation || ''}
              onChange={handleInputChange}
              className="mt-1"
            />
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
        
        <div className="pt-4">
          <Button onClick={onUpdate} className="w-full">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Properties
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
