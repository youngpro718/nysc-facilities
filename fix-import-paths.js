// Script to fix all import paths from @/integrations/supabase/client to @/lib/supabase

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/hooks/occupants/useOccupantAssignments.ts',
  'src/hooks/useAdminDashboardData.ts',
  'src/hooks/useAdminNotifications.ts',
  'src/hooks/useAuth.tsx',
  'src/hooks/useCourtPersonnel.ts',
  'src/hooks/useDashboardData.ts',
  'src/hooks/useDashboardSubscriptions.ts',
  'src/hooks/useEnhancedRoomData.ts',
  'src/hooks/useKeyAssignment.ts',
  'src/hooks/useKeyOrders.ts',
  'src/hooks/useKeyRequestWorkflow.ts',
  'src/hooks/useKeyRequests.ts',
  'src/hooks/useLightingSubmit.ts',
  'src/hooks/useMonitoring.ts',
  'src/hooks/useNotifications.ts',
  'src/hooks/useOccupantAccess.ts',
  'src/hooks/usePhotoUpload.ts',
  'src/hooks/useRealtimeNotifications.ts'
];

const fixes = [
  {
    find: "from '@/integrations/supabase/client'",
    replace: "from '@/lib/supabase'"
  },
  {
    find: "from '@/services/supabase/authService'",
    replace: "from '@/lib/supabase'"
  },
  {
    find: "from '@/services/supabase'",
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