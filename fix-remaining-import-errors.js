const fs = require('fs');
const path = require('path');

// All files with import issues based on the build errors
const filesToFix = [
  'src/hooks/dashboard/useAdminIssuesData.ts',
  'src/hooks/dashboard/useEnhancedRoomAssignments.ts', 
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
  'src/hooks/useRealtimeNotifications.ts',
  'src/hooks/useRequestActions.ts',
  'src/hooks/useUnifiedPersonnel.ts',
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

// Import replacements
const replacements = [
  {
    from: "import { supabase } from '@/integrations/supabase/client';",
    to: "import { supabase } from '@/lib/supabase';"
  },
  {
    from: "import authService from '@/services/supabase/authService';",
    to: "import { authService } from '@/lib/supabase';"
  },
  {
    from: "import { getKeyRequests } from '@/services/supabase/keyRequestService';",
    to: "import { supabase } from '@/lib/supabase';"
  },
  {
    from: "import { getSupplyRequests, updateSupplyRequestStatus } from '@/services/supabase/supplyRequestService';",
    to: "import { getSupplyRequests, updateSupplyRequestStatus } from '@/lib/supabase';"
  },
  {
    from: "import { markLightsOut, markLightsFixed } from '@/services/supabase';",
    to: "import { markLightsOut, markLightsFixed } from '@/lib/supabase';"
  }
];

console.log('Fixing import errors...');

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  }
});

console.log('Import fixes complete!');