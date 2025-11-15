const fs = require('fs');
const path = require('path');

// Comprehensive fix for all import issues
console.log('🔧 Running comprehensive import fix...');

const fixes = [
  {
    file: 'src/components/supply/FulfillmentWorkflow.tsx',
    find: "import { startSupplyRequestWork, completeSupplyRequestWork, getFulfillmentLog } from '@/services/supabase/supplyRequestService';",
    replace: "import { startSupplyRequestWork, completeSupplyRequestWork, getFulfillmentLog } from '@/lib/supabase';"
  }
];

// Apply manual fixes first
for (const fix of fixes) {
  try {
    const filePath = path.join(process.cwd(), fix.file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(fix.find)) {
        content = content.replace(fix.find, fix.replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${fix.file}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error fixing ${fix.file}:`, error.message);
  }
}

// Now run the comprehensive script
require('./scripts/fix-final-imports.js');