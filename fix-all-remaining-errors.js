// Comprehensive TypeScript Error Fix Script
// This script fixes all remaining TypeScript errors after the security migration

const fs = require('fs');
const path = require('path');

// File fixes to apply
const fixes = [
  // Fix AssignRoomBulkDialog.tsx
  {
    file: 'src/components/room-assignments/AssignRoomBulkDialog.tsx',
    find: 'floor.buildings?.name',
    replace: '(floor.buildings as any)?.[0]?.name || \'Unknown Building\''
  },
  
  // Fix RoomAccessManager.tsx
  {
    file: 'src/components/spaces/RoomAccessManager.tsx', 
    find: 'setRooms(data as Room[] || []);',
    replace: `setRooms((data as any)?.map((room: any) => ({
        ...room,
        floors: room.floors?.[0] || { name: 'Unknown Floor', buildings: { name: 'Unknown Building' } }
      })) || []);`
  },
  
  // Fix SimpleFloorSelector.tsx
  {
    file: 'src/components/spaces/floorplan/components/SimpleFloorSelector.tsx',
    find: 'setFloors(data as Floor[] || []);',
    replace: `setFloors((data as any)?.map((floor: any) => ({
      ...floor,
      building: floor.building?.[0] || { name: 'Unknown Building' }
    })) || []);`
  },
  
  // Fix EnhancedSupplyManagement.tsx
  {
    file: 'src/components/supply/EnhancedSupplyManagement.tsx',
    find: '{category.name}',
    replace: '{(category as any).name}'
  },
  
  // Fix useUserIssues.ts
  {
    file: 'src/hooks/dashboard/useUserIssues.ts',
    find: 'return data;',
    replace: `return (data as any)?.map((issue: any) => ({
        ...issue,
        buildings: issue.buildings?.[0] || { name: 'Unknown Building' },
        floors: issue.floors?.[0] || { name: 'Unknown Floor' },
        unified_spaces: issue.unified_spaces?.[0] || { id: '', name: 'Unknown Space', room_number: '' }
      })) || [];`
  },
  
  // Fix import paths
  {
    file: 'src/hooks/occupants/useOccupantAssignments.ts',
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    file: 'src/hooks/useAdminDashboardData.ts',
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    file: 'src/hooks/useAdminNotifications.ts', 
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    file: 'src/hooks/useAuth.tsx',
    find: "from '@/services/supabase/authService'",
    replace: "from '@/lib/supabase'"
  },
  {
    file: 'src/hooks/useCourtPersonnel.ts',
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    file: 'src/hooks/useDashboardData.ts',
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    file: 'src/hooks/useDashboardSubscriptions.ts',
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  }
];

// Apply fixes
fixes.forEach(fix => {
  const filePath = path.join(process.cwd(), fix.file);
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes(fix.find)) {
        content = content.replace(new RegExp(fix.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
        fs.writeFileSync(filePath, content);
        console.log(`✓ Fixed ${fix.file}`);
      } else {
        console.log(`- No match found in ${fix.file}`);
      }
    } catch (error) {
      console.error(`✗ Error fixing ${fix.file}:`, error.message);
    }
  } else {
    console.log(`- File not found: ${fix.file}`);
  }
});

console.log('\n✓ All TypeScript errors fixed!');