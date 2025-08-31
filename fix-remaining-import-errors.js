// Script to fix all remaining import path errors

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/hooks/useKeyAssignment.ts',
  'src/hooks/useKeyOrders.ts',
  'src/hooks/useKeyRequestWorkflow.ts',
  'src/hooks/useKeyRequests.ts',
  'src/hooks/useLightingSubmit.ts',
  'src/hooks/useMonitoring.ts',
  'src/hooks/useNotifications.ts',
  'src/hooks/useOccupantAccess.ts',
  'src/hooks/usePhotoUpload.ts',
  'src/hooks/useRealtimeNotifications.ts',
  'src/hooks/useRequestActions.ts',
  'src/hooks/useRoomAccess.ts',
  'src/hooks/useUserRoomAssignments.ts',
  'src/pages/InventoryDashboard.tsx',
  'src/pages/Keys.tsx',
  'src/pages/MyRequests.tsx',
  'src/pages/Operations.tsx',
  'src/pages/Users.tsx',
  'src/pages/admin/KeyRequests.tsx',
  'src/pages/admin/SupplyRequests.tsx',
  'src/services/courtroom-photos.ts',
  'src/services/inventoryPhotoService.ts',
  'src/services/lighting-operations-integration.ts',
  'src/services/storage.ts'
];

const fixes = [
  {
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    find: "from '@/services/supabase'",
    replace: "from '@/lib/supabase'"
  },
  {
    find: "from '@/services/supabase/keyRequestService'",
    replace: "from '@/lib/supabase'"
  },
  {
    find: "from '@/services/supabase/supplyRequestService'",
    replace: "from '@/lib/supabase'"
  }
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      if (content.includes(fix.find)) {
        content = content.replace(new RegExp(fix.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✓ Fixed imports in ${filePath}`);
    } else {
      console.log(`- No changes needed in ${filePath}`);
    }
  } else {
    console.log(`- File not found: ${filePath}`);
  }
});

console.log('\n✓ Import path fixes completed!');