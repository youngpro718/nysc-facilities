import React from "react";
import { EnhancedRoomCard } from "./components/EnhancedRoomCard";
import { RoomCard } from "./RoomCard";
import { EnhancedRoom } from "./types/EnhancedRoomTypes";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "./types/roomEnums";

// Mock room data for showcase
const mockRooms: EnhancedRoom[] = [
  {
    id: "1",
    name: "Judge Smith's Chambers",
    room_number: "1001",
    room_type: RoomTypeEnum.COURTROOM,
    description: "Main courtroom for civil proceedings with advanced AV system",
    status: StatusEnum.ACTIVE,
    floor_id: "floor-1",
    building_id: "building-1",
    current_function: "Civil Court Proceedings",
    phone_number: "(555) 123-4567",
    current_occupants: [
      { first_name: "John", last_name: "Smith" },
      { first_name: "Jane", last_name: "Doe" }
    ],
    is_storage: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    name: "Central Clerks Office",
    room_number: "1000",
    room_type: RoomTypeEnum.OFFICE,
    description: "Main administrative office for court operations",
    status: StatusEnum.ACTIVE,
    floor_id: "floor-1",
    building_id: "building-1",
    current_function: "Administrative Operations",
    current_occupants: [
      { first_name: "Alice", last_name: "Johnson" },
      { first_name: "Bob", last_name: "Wilson" },
      { first_name: "Carol", last_name: "Brown" }
    ],
    is_storage: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    name: "Storage Room A",
    room_number: "S101",
    room_type: RoomTypeEnum.UTILITY_ROOM,
    description: "General storage for office supplies and equipment",
    status: StatusEnum.ACTIVE,
    floor_id: "floor-1",
    building_id: "building-1",
    is_storage: true,
    storage_type: StorageTypeEnum.GENERAL,
    storage_capacity: 500,
    storage_notes: "Climate controlled storage",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "4",
    name: "Female Locker Room",
    room_number: "L201",
    room_type: RoomTypeEnum.FEMALE_LOCKER_ROOM,
    description: "Locker facilities for female court officers",
    status: StatusEnum.UNDER_MAINTENANCE,
    floor_id: "floor-2",
    building_id: "building-1",
    current_function: "Staff Facilities",
    is_storage: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function CardShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Room Card UI Showcase</h2>
        <p className="text-muted-foreground mb-6">
          Comparison of different room card designs and variants
        </p>
      </div>

      {/* Original Cards */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Current Design</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockRooms.map((room) => (
            <RoomCard
              key={`original-${room.id}`}
              room={room}
              onDelete={() => {}}
              onRoomClick={() => {}}
            />
          ))}
        </div>
      </section>

      {/* Enhanced Default Cards */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Enhanced Design - Default</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockRooms.map((room) => (
            <EnhancedRoomCard
              key={`enhanced-${room.id}`}
              room={room}
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="default"
            />
          ))}
        </div>
      </section>

      {/* Compact Cards */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Enhanced Design - Compact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {mockRooms.map((room) => (
            <EnhancedRoomCard
              key={`compact-${room.id}`}
              room={room}
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="compact"
            />
          ))}
        </div>
      </section>

      {/* Detailed Cards */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Enhanced Design - Detailed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRooms.map((room) => (
            <EnhancedRoomCard
              key={`detailed-${room.id}`}
              room={room}
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="detailed"
            />
          ))}
        </div>
      </section>

      {/* Mixed Layout Example */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Mixed Layout - Adaptive Sizing</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Important rooms get larger cards */}
          <div className="md:col-span-2 lg:col-span-2">
            <EnhancedRoomCard
              room={mockRooms[0]} // Courtroom
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="detailed"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <EnhancedRoomCard
              room={mockRooms[1]} // Office
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="default"
            />
          </div>
          {/* Utility rooms get compact cards */}
          <div className="md:col-span-1 lg:col-span-1">
            <EnhancedRoomCard
              room={mockRooms[2]} // Storage
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="compact"
            />
          </div>
          <div className="md:col-span-1 lg:col-span-1">
            <EnhancedRoomCard
              room={mockRooms[3]} // Locker room
              onDelete={() => {}}
              onRoomClick={() => {}}
              variant="compact"
            />
          </div>
        </div>
      </section>

      {/* Design Features */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">✨ Enhanced Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">🎨 Visual Enhancements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Color-coded room types</li>
              <li>• Gradient backgrounds</li>
              <li>• Health score rings</li>
              <li>• Status indicators</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">📊 Data Visualization</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Usage progress bars</li>
              <li>• Quick stats grid</li>
              <li>• Real-time metrics</li>
              <li>• Trend indicators</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">🔄 Interactions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Hover animations</li>
              <li>• Contextual actions</li>
              <li>• Responsive layouts</li>
              <li>• Touch-friendly</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
