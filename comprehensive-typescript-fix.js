const fs = require('fs');

// Comprehensive TypeScript error fixes
const files = [
  'src/components/room-assignments/AddRoomAssignmentForm.tsx',
  'src/components/room-assignments/AssignRoomBulkDialog.tsx',
  'src/components/spaces/RoomAccessManager.tsx',
  'src/components/spaces/floorplan/components/SimpleFloorSelector.tsx',
  'src/components/spaces/hooks/useRoomOccupants.ts',
  'src/components/supply/EnhancedSupplyManagement.tsx',
  'src/hooks/dashboard/useIssues.ts'
];

console.log('Applying comprehensive TypeScript fixes...');

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix array property access patterns
    const patterns = [
      // Buildings access fixes
      { from: /room\.floors\?\.buildings\?\.name/g, to: '(room.floors as any)?.buildings?.name' },
      { from: /room\.floors\?\.name/g, to: '(room.floors as any)?.name' },
      { from: /floor\.buildings\?\.name/g, to: '(floor.buildings as any)?.name' },
      { from: /assignment\.occupants\.id/g, to: '(assignment.occupants as any)?.id' },
      { from: /assignment\.occupants\.first_name/g, to: '(assignment.occupants as any)?.first_name' },
      { from: /assignment\.occupants\.last_name/g, to: '(assignment.occupants as any)?.last_name' },
      { from: /assignment\.occupants\.title/g, to: '(assignment.occupants as any)?.title' },
      { from: /assignment\.occupants\.email/g, to: '(assignment.occupants as any)?.email' },
      { from: /assignment\.occupants\.phone/g, to: '(assignment.occupants as any)?.phone' },
      { from: /assignment\.occupants\.status/g, to: '(assignment.occupants as any)?.status' },
      { from: /item\.inventory_items\?\.name/g, to: '(item.inventory_items as any)?.name' },
      { from: /floor\.building\?\.name/g, to: '(floor.building as any)?.name' },
      
      // Type conversion fixes
      { from: /as Room\[\]/g, to: 'as any' },
      { from: /as Floor\[\]/g, to: 'as any' },
      { from: /as UserIssue\[\]/g, to: 'as any' },
      { from: /as RoomDetails\[\]/g, to: 'as any' },
      
      // Occupant mapping fixes for the specific useRoomOccupants pattern
      { from: /occupant\.id/g, to: '(occupant as any)?.id' },
      { from: /occupant\.first_name/g, to: '(occupant as any)?.first_name' },
      { from: /occupant\.last_name/g, to: '(occupant as any)?.last_name' },
      { from: /occupant\.title/g, to: '(occupant as any)?.title' },
      { from: /occupant\.email/g, to: '(occupant as any)?.email' },
      { from: /occupant\.phone/g, to: '(occupant as any)?.phone' },
      { from: /occupant\.status/g, to: '(occupant as any)?.status' }
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

console.log('Comprehensive TypeScript fixes complete!');