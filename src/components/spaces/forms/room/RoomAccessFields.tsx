import React, { useState } from "react";
import { logger } from '@/lib/logger';
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Key, Lock, FileBox, Package, Archive, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { RoomFormData, RoomAccessData } from "./RoomFormSchema";

interface RoomAccessFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

interface KeyOption {
  id: string;
  name: string;
  is_passkey: boolean;
}

const ACCESS_TYPE_OPTIONS = [
  { value: 'room_entry', label: 'Room Entry', icon: Key, description: 'Main key to enter the room' },
  { value: 'office_door', label: 'Office Door', icon: Lock, description: 'Internal office doors' },
  { value: 'locker', label: 'Locker', icon: FileBox, description: 'Personal lockers' },
  { value: 'cabinet', label: 'Cabinet', icon: Package, description: 'File cabinets and storage' },
  { value: 'storage', label: 'Storage', icon: Archive, description: 'Storage rooms and areas' },
  { value: 'key_box', label: 'Key Box', icon: MapPin, description: 'Key storage boxes' },
];

export default function RoomAccessFields({ form }: RoomAccessFieldsProps) {
  const [selectedAccessType, setSelectedAccessType] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [description, setDescription] = useState("");
  const [locationWithinRoom, setLocationWithinRoom] = useState("");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomAccess",
  });

  // Fetch available keys
  const { data: keys = [] } = useQuery({
    queryKey: ["keys-for-room-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("id, name, is_passkey")
        .eq("status", "available")
        .order("name");

      if (error) {
        logger.error("Error fetching keys:", error);
        return [];
      }

      return data as KeyOption[];
    },
  });

  const addRoomAccess = () => {
    if (!selectedAccessType) return;

    const selectedKeyData = keys.find(k => k.id === selectedKey);
    
    const newAccess: RoomAccessData = {
      accessType: selectedAccessType as unknown,
      keyId: selectedKey || undefined,
      keyName: selectedKeyData?.name || undefined,
      description: description || undefined,
      locationWithinRoom: locationWithinRoom || undefined,
    };

    append(newAccess);
    
    // Reset form
    setSelectedAccessType("");
    setSelectedKey("");
    setDescription("");
    setLocationWithinRoom("");
  };

  const removeAccess = (index: number) => {
    remove(index);
  };

  const getAccessTypeInfo = (type: string) => {
    return ACCESS_TYPE_OPTIONS.find(opt => opt.value === type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Room Access Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Passkey Access Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="passkey-enabled">Passkey Access Enabled</Label>
            <p className="text-sm text-muted-foreground">
              Allow passkeys to access this room
            </p>
          </div>
          <Switch
            id="passkey-enabled"
            checked={form.watch("passkeyEnabled") || false}
            onCheckedChange={(checked) => form.setValue("passkeyEnabled", checked)}
          />
        </div>

        {/* Add New Access Item Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h4 className="font-medium">Add Access Item</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access-type">Access Type</Label>
              <Select value={selectedAccessType} onValueChange={setSelectedAccessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-select">Key (Optional)</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No key assigned</SelectItem>
                  {keys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span>{key.name}</span>
                        {key.is_passkey && (
                          <Badge variant="secondary" className="text-xs">Passkey</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Main entrance, Office 101, Locker #5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location within Room</Label>
              <Input
                id="location"
                placeholder="e.g., North wall, Corner office, Near window"
                value={locationWithinRoom}
                onChange={(e) => setLocationWithinRoom(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={addRoomAccess}
            disabled={!selectedAccessType}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Access Item
          </Button>
        </div>

        {/* Current Access Items */}
        <div className="space-y-4">
          <h4 className="font-medium">Current Access Items ({fields.length})</h4>
          
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No access items configured</p>
              <p className="text-sm">Add access items above to manage room keys and locks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => {
                const access = field as RoomAccessData;
                const typeInfo = getAccessTypeInfo(access.accessType);
                const Icon = typeInfo?.icon || Key;

                return (
                  <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{typeInfo?.label}</span>
                        {access.keyName && (
                          <Badge variant="outline" className="text-xs">
                            Key: {access.keyName}
                          </Badge>
                        )}
                      </div>
                      
                      {access.description && (
                        <p className="text-sm text-muted-foreground">{access.description}</p>
                      )}
                      
                      {access.locationWithinRoom && (
                        <p className="text-xs text-muted-foreground">📍 {access.locationWithinRoom}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAccess(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}