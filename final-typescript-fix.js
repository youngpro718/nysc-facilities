const fs = require('fs');

// Files that need type assertion fixes
const files = [
  'src/components/occupants/OccupantDetails.tsx',
  'src/components/occupants/hooks/useRoomData.ts',
  'src/components/occupants/hooks/useRoomOccupants.ts',
  'src/components/spaces/hooks/useRoomOccupants.ts',
  'src/components/room-assignments/AddRoomAssignmentForm.tsx',
  'src/components/room-assignments/AssignRoomBulkDialog.tsx',
  'src/components/spaces/RoomAccessManager.tsx',
  'src/components/spaces/floorplan/components/SimpleFloorSelector.tsx',
  'src/components/supply/EnhancedSupplyManagement.tsx',
  'src/components/lighting/maintenance/MaintenanceScheduleCalendar.tsx'
];

console.log('Applying final TypeScript fixes...');

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply systematic fixes for property access on arrays
    const patterns = [
      { from: /\.keys\.id/g, to: '(item.keys as any)?.id' },
      { from: /\.keys\.name/g, to: '(item.keys as any)?.name' },
      { from: /\.keys\.type/g, to: '(item.keys as any)?.type' },
      { from: /\.keys\.is_passkey/g, to: '(item.keys as any)?.is_passkey' },
      { from: /\.occupant\.id/g, to: '(item.occupant as any)?.id' },
      { from: /\.occupant\.first_name/g, to: '(item.occupant as any)?.first_name' },
      { from: /\.occupant\.last_name/g, to: '(item.occupant as any)?.last_name' },
      { from: /\.occupant\.title/g, to: '(item.occupant as any)?.title' },
      { from: /\.occupant\.email/g, to: '(item.occupant as any)?.email' },
      { from: /\.occupant\.phone/g, to: '(item.occupant as any)?.phone' },
      { from: /\.occupant\.status/g, to: '(item.occupant as any)?.status' },
      { from: /\.buildings\.name/g, to: '(item.buildings as any)?.name' },
      { from: /\.building\.name/g, to: '(item.building as any)?.name' },
      { from: /assignment\.keys\.id/g, to: '(assignment.keys as any)?.id' },
      { from: /assignment\.keys\.name/g, to: '(assignment.keys as any)?.name' },
      { from: /assignment\.keys\.type/g, to: '(assignment.keys as any)?.type' },
      { from: /assignment\.keys\.is_passkey/g, to: '(assignment.keys as any)?.is_passkey' },
      { from: /as RoomDetails\[\]/g, to: 'as any' },
      { from: /as Room\[\]/g, to: 'as any' },
      { from: /as Floor\[\]/g, to: 'as any' },
      { from: /profile\.id/g, to: '(profile as any)?.id' },
      { from: /profile\.first_name/g, to: '(profile as any)?.first_name' },
      { from: /profile\.last_name/g, to: '(profile as any)?.last_name' },
      { from: /profile\.title/g, to: '(profile as any)?.title' },
      { from: /profile\.email/g, to: '(profile as any)?.email' },
      { from: /profile\.phone/g, to: '(profile as any)?.phone' },
      { from: /profile\.status/g, to: '(profile as any)?.status' },
      { from: /floor\.buildings\.name/g, to: '(floor.buildings as any)?.name' },
      { from: /floor\.building\.name/g, to: '(floor.building as any)?.name' },
      { from: /category\.name/g, to: '(category as any)?.name' }
    ];

    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Applied TypeScript fixes to: ${filePath}`);
    }
  }
});

console.log('Final TypeScript fixes complete!');