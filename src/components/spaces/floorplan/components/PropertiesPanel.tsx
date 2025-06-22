import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Room } from "@/components/spaces/types/RoomTypes";
import { Edit2, X } from "lucide-react";

interface ObjectProperties {
  id?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
  roomType?: string;
  status?: string;
  capacity?: number;
  description?: string;
}

export function PropertiesPanel({
  selectedObject,
  onUpdateObject,
  onClose
}: {
  selectedObject: ObjectProperties | null;
  onUpdateObject: (id: string, updates: Partial<ObjectProperties>) => void;
  onClose: () => void;
}) {
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    setEditingProperty(null);
    setTempValue('');
  }, [selectedObject]);

  if (!selectedObject) {
    return null;
  }

  const handlePropertyEdit = (property: string, currentValue: any) => {
    setEditingProperty(property);
    setTempValue(String(currentValue || ''));
  };

  const handlePropertySave = (property: string) => {
    if (selectedObject.id) {
      let value: any = tempValue;
      
      // Convert to appropriate type
      if (['x', 'y', 'width', 'height', 'rotation', 'capacity'].includes(property)) {
        value = parseFloat(tempValue) || 0;
      }
      
      onUpdateObject(selectedObject.id, { [property]: value });
    }
    setEditingProperty(null);
    setTempValue('');
  };

  const handlePropertyCancel = () => {
    setEditingProperty(null);
    setTempValue('');
  };

  const renderEditableProperty = (label: string, property: string, currentValue: any) => {
    const isEditing = editingProperty === property;
    
    return (
      <div className="flex items-center justify-between py-2">
        <Label className="text-sm font-medium">{label}:</Label>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-24 h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePropertySave(property);
                  if (e.key === 'Escape') handlePropertyCancel();
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePropertySave(property)}
                className="h-8 w-8 p-0"
              >
                ✓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePropertyCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm">{currentValue}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePropertyEdit(property, currentValue)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Properties</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Badge variant="secondary" className="mb-4">
            {selectedObject.type}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Position & Size</h4>
          {renderEditableProperty('X', 'x', Math.round(selectedObject.x))}
          {renderEditableProperty('Y', 'y', Math.round(selectedObject.y))}
          {renderEditableProperty('Width', 'width', Math.round(selectedObject.width))}
          {renderEditableProperty('Height', 'height', Math.round(selectedObject.height))}
          {selectedObject.rotation !== undefined && 
            renderEditableProperty('Rotation', 'rotation', Math.round(selectedObject.rotation))}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Properties</h4>
          {renderEditableProperty('Label', 'label', selectedObject.label || '')}
          
          {selectedObject.type === 'room' && (
            <>
              {renderEditableProperty('Room Type', 'roomType', selectedObject.roomType || '')}
              {renderEditableProperty('Status', 'status', selectedObject.status || '')}
              {renderEditableProperty('Capacity', 'capacity', selectedObject.capacity || '')}
              {renderEditableProperty('Description', 'description', selectedObject.description || '')}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
