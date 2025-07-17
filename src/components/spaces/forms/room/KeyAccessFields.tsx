import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, DoorClosed as Door, Plus, X, Shield } from "lucide-react";
import { RoomFormData } from "./RoomFormSchema";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface KeyAccessFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

interface KeyOption {
  id: string;
  name: string;
  is_passkey: boolean;
}

interface DoorOption {
  id: string;
  name: string;
}

export function KeyAccessFields({ form }: KeyAccessFieldsProps) {
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedDoor, setSelectedDoor] = useState<string>("");
  
  const floorId = form.watch("floorId");

  // Get available keys
  const { data: keys = [] } = useQuery<KeyOption[]>({
    queryKey: ['keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keys')
        .select('id, name, is_passkey')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get doors on the same floor
  const { data: doors = [] } = useQuery<DoorOption[]>({
    queryKey: ['doors', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('doors')
        .select('id, name')
        .eq('floor_id', floorId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!floorId
  });

  const currentConnections = form.watch("keyDoorConnections") || [];

  const addKeyDoorConnection = () => {
    if (!selectedKey || !selectedDoor) return;
    
    const key = keys.find(k => k.id === selectedKey);
    const door = doors.find(d => d.id === selectedDoor);
    
    if (!key || !door) return;

    const newConnection = {
      keyId: selectedKey,
      keyName: key.name,
      doorId: selectedDoor,
      doorName: door.name,
      isPasskey: key.is_passkey
    };

    const existing = currentConnections.find(
      c => c.keyId === selectedKey && c.doorId === selectedDoor
    );

    if (!existing) {
      form.setValue("keyDoorConnections", [...currentConnections, newConnection]);
      setSelectedKey("");
      setSelectedDoor("");
    }
  };

  const removeConnection = (keyId: string, doorId: string) => {
    const updated = currentConnections.filter(
      c => !(c.keyId === keyId && c.doorId === doorId)
    );
    form.setValue("keyDoorConnections", updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5" />
          Key Access Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormDescription>
          Specify which keys can open which doors for this room. Master keys typically open most doors.
        </FormDescription>

        {/* Add new key-door connection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
          <div>
            <FormLabel className="text-sm font-medium">Select Key</FormLabel>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a key" />
              </SelectTrigger>
              <SelectContent>
                {keys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    <div className="flex items-center gap-2">
                      {key.is_passkey && <Shield className="h-4 w-4 text-primary" />}
                      <span>{key.name}</span>
                      {key.is_passkey && <Badge variant="secondary" className="text-xs">Master</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FormLabel className="text-sm font-medium">Select Door</FormLabel>
            <Select value={selectedDoor} onValueChange={setSelectedDoor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a door" />
              </SelectTrigger>
              <SelectContent>
                {doors.map((door) => (
                  <SelectItem key={door.id} value={door.id}>
                    <div className="flex items-center gap-2">
                      <Door className="h-4 w-4" />
                      <span>{door.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              type="button" 
              onClick={addKeyDoorConnection}
              disabled={!selectedKey || !selectedDoor}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Access
            </Button>
          </div>
        </div>

        {/* Current connections */}
        {currentConnections.length > 0 && (
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium">Current Key Access</FormLabel>
            <div className="space-y-2">
              {currentConnections.map((connection, index) => (
                <div key={`${connection.keyId}-${connection.doorId}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {connection.isPasskey && <Shield className="h-4 w-4 text-primary" />}
                      <Key className="h-4 w-4" />
                      <span className="font-medium">{connection.keyName}</span>
                      {connection.isPasskey && <Badge variant="secondary" className="text-xs">Master</Badge>}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                      <Door className="h-4 w-4" />
                      <span>{connection.doorName}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConnection(connection.keyId, connection.doorId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentConnections.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No key access configured yet</p>
            <p className="text-sm">Add key-door relationships above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}