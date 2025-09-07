#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fixes...');

// Define all the import replacements needed
const importReplacements = [
  {
    from: `from '@/integrations/supabase/client'`,
    to: `from '@/lib/supabase'`
  },
  {
    from: `from '@/integrations/supabase/types'`,
    to: `from '@/types/supabase'`
  },
  {
    from: `from '@/services/supabase/supplyRequestService'`,
    to: `from '@/lib/supabase'`
  },
  {
    from: `from '@/services/supabase'`,
    to: `from '@/lib/supabase'`
  },
  {
    from: `from '../integrations/supabase/client'`,
    to: `from '@/lib/supabase'`
  },
  {
    from: `from '@/services/supabase/authService'`,
    to: `from '@/services/supabase/authService'` // Keep this one as is
  },
  {
    from: `from '@/services/supabase/keyRequestService'`,
    to: `from '@/services/supabase/keyRequestService'` // Keep this one as is
  }
];

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    for (const replacement of importReplacements) {
      // Skip authService and keyRequestService - they should stay as is
      if (replacement.from.includes('authService') || replacement.from.includes('keyRequestService')) {
        continue;
      }
      
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (['node_modules', '.git', 'dist', 'build'].includes(item)) continue;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...walkDirectory(fullPath, extensions));
      } else if (extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

const srcPath = path.join(__dirname, 'src');
const files = walkDirectory(srcPath);

console.log(`📁 Found ${files.length} files to process`);

let fixedCount = 0;
for (const file of files) {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Import fix complete! Fixed ${fixedCount} files`);

// Also fix the specific lib/supabase.ts file
const libSupabasePath = path.join(__dirname, 'src/lib/supabase.ts');
try {
  let libContent = fs.readFileSync(libSupabasePath, 'utf8');
  
  // Fix the imports in lib/supabase.ts to use the correct paths
  libContent = libContent.replace(
    `export { supabase, supabaseWithRetry } from '@/integrations/supabase/client';`,
    `export { supabase, supabaseWithRetry } from '@/integrations/supabase/client';`
  );
  
  libContent = libContent.replace(
    `import type { Database } from '@/integrations/supabase/types';`,
    `import type { Database } from '@/integrations/supabase/types';`
  );
  
  libContent = libContent.replace(
    `import { supabase } from '@/integrations/supabase/client';`,
    `import { supabase } from '@/integrations/supabase/client';`
  );
  
  // Keep the lib/supabase.ts imports pointing to the actual integration files
  console.log(`🔧 lib/supabase.ts imports are correct`);
  
} catch (error) {
  console.error('Error fixing lib/supabase.ts:', error.message);
}
