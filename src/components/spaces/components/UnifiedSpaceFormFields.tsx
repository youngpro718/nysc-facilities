import { UseFormReturn } from "react-hook-form";
import { UnifiedSpaceFormData } from "../schemas/unifiedSpaceSchema";
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BuildingFloorSelector } from "../forms/space/BasicSpaceFields";
import { ParentRoomField } from "../forms/room/ParentRoomField";
import { CourtroomPhotoUpload } from "../forms/room/CourtroomPhotoUpload";
import { RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

interface UnifiedSpaceFormFieldsProps {
  form: UseFormReturn<UnifiedSpaceFormData>;
  mode: "create" | "edit";
  roomId?: string;
}

export function UnifiedSpaceFormFields({ form, mode, roomId }: UnifiedSpaceFormFieldsProps) {
  const spaceType = form.watch("type");
  const floorId = form.watch("floorId");
  const isStorage = form.watch("isStorage");
  const roomType = form.watch("roomType");

  return (
    <div className="space-y-6">
      {/* Space Type Selection - Only in create mode */}
      {mode === "create" && (
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Space Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select space type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="hallway">Hallway</SelectItem>
                  <SelectItem value="door">Door</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Building and Floor Selection */}
      {mode === "create" && (
        <BuildingFloorSelector 
          form={form as any} 
          buildingFieldName="buildingId"
          floorFieldName="floorId"
        />
      )}

      {/* Basic Fields */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter space name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter space description" 
                {...field} 
                value={field.value || ""} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Room-specific fields */}
      {spaceType === "room" && (
        <>
          <Separator />
          
          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter room number" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roomType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(RoomTypeEnum).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentFunction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Function</FormLabel>
                <FormControl>
                  <Input placeholder="Enter current function" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Parent Room Field */}
          {floorId && (
            <>
              <Separator />
              <ParentRoomField form={form as any} floorId={floorId} currentRoomId={roomId} />
            </>
          )}

          {/* Storage Fields */}
          <Separator />
          <FormField
            control={form.control}
            name="isStorage"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Storage Room</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    This room is used for storage purposes
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isStorage && (
            <>
              <FormField
                control={form.control}
                name="storageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(StorageTypeEnum).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Capacity (sq ft)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter capacity in square feet"
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter storage-specific notes"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Courtroom Photos */}
          {roomType === RoomTypeEnum.COURTROOM && (
            <>
              <Separator />
              <CourtroomPhotoUpload form={form as any} />
            </>
          )}
        </>
      )}

      {/* Hallway-specific fields */}
      {spaceType === "hallway" && (
        <>
          <Separator />
          
          <FormField
            control={form.control}
            name="hallwayType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hallway Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hallway type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public_main">Public Main</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="left_wing">Left Wing</SelectItem>
                    <SelectItem value="right_wing">Right Wing</SelectItem>
                    <SelectItem value="connector">Connector</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trafficFlow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Traffic Flow</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select traffic flow" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="one_way">One Way</SelectItem>
                    <SelectItem value="two_way">Two Way</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {/* Door-specific fields */}
      {spaceType === "door" && (
        <>
          <Separator />
          
          <FormField
            control={form.control}  
            name="doorType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Door Type</FormLabel>
                <FormControl>
                  <Input placeholder="Enter door type" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="securityLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Level</FormLabel>
                <FormControl>
                  <Input placeholder="Enter security level" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}