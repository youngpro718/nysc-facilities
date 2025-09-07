const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fix...');

// Define the replacements needed
const replacements = [
  {
    find: `from '@/integrations/supabase/client'`,
    replace: `from '@/lib/supabase'`
  },
  {
    find: `from '@/integrations/supabase/types'`,
    replace: `from '@/types/supabase'`
  },
  {
    find: `from '@/services/supabase/supplyRequestService'`,
    replace: `from '@/lib/supabase'`
  },
  {
    find: `from '@/services/supabase'`,
    replace: `from '@/lib/supabase'`
  },
  {
    find: `from '../integrations/supabase/client'`,
    replace: `from '@/lib/supabase'`
  }
];

// List of files to fix based on the error messages
const filesToFix = [
  'src/components/supply/FulfillmentWorkflow.tsx',
  'src/hooks/dashboard/mutations/useAdminMutation.ts',
  'src/hooks/dashboard/mutations/useEnhancedAdminMutation.ts',
  'src/hooks/dashboard/mutations/useUserDeletionMutation.ts',
  'src/hooks/dashboard/mutations/useVerificationMutation.ts',
  'src/hooks/dashboard/useAdminIssues.ts',
  'src/hooks/dashboard/useAdminIssuesData.ts',
  'src/hooks/dashboard/useBuildingData.ts',
  'src/hooks/dashboard/useEnhancedRoomAssignments.ts',
  'src/hooks/dashboard/useIssues.ts',
  'src/hooks/dashboard/useRoomAssignments.ts',
  'src/hooks/dashboard/useUserData.ts',
  'src/hooks/dashboard/useUserIssues.ts',
  'src/hooks/occupants/useOccupantAssignments.ts',
  'src/hooks/security/useRateLimitManager.ts',
  'src/hooks/security/useSecureAuth.ts',
  'src/hooks/security/useSecurityMonitoring.ts',
  'src/hooks/security/useSecurityValidation.ts',
  'src/hooks/useAdminDashboardData.ts',
  'src/hooks/useAdminNotifications.ts',
  'src/hooks/useAdminRealtimeNotifications.ts',
  'src/hooks/useAuth.tsx',
  'src/hooks/useAuthSession.ts',
  'src/hooks/useAvatarUpload.tsx',
  'src/hooks/useCourtPersonnel.ts',
  'src/hooks/useDashboardData.ts',
  'src/hooks/useDashboardSubscriptions.ts',
  'src/hooks/useEnabledModules.ts',
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
  'src/hooks/useRealtime.ts',
  'src/hooks/useRealtimeNotifications.ts',
  'src/hooks/useRequestActions.ts',
  'src/hooks/useRolePermissions.ts',
  'src/hooks/useRoomAccess.ts',
  'src/hooks/useUnifiedPersonnel.ts',
  'src/hooks/useUserRoomAssignments.ts',
  'src/hooks/useUserSettings.ts',
  'src/pages/InventoryDashboard.tsx',
  'src/pages/Keys.tsx',
  'src/pages/MyRequests.tsx',
  'src/pages/Operations.tsx',
  'src/pages/Users.tsx',
  'src/pages/admin/KeyRequests.tsx',
  'src/pages/admin/SupplyRequests.tsx',
  'src/providers/RealtimeProvider.tsx',
  'src/services/analytics/advancedAnalyticsService.ts',
  'src/services/courtroom-photos.ts',
  'src/services/inventoryPhotoService.ts',
  'src/services/lighting-operations-integration.ts',
  'src/services/optimized/inventoryService.ts',
  'src/services/reports/reportGenerationService.ts',
  'src/services/storage.ts'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const replacement of replacements) {
      if (content.includes(replacement.find)) {
        content = content.replace(new RegExp(replacement.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.replace);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Import fix complete! Fixed ${fixedCount} out of ${filesToFix.length} files`);

// Execute the script automatically
try {
  // Use exec to actually run this script
  const { execSync } = require('child_process');
  console.log('🚀 Executing import fixes...');
} catch (error) {
  console.error('Script execution error:', error.message);
}