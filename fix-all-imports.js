#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fixes...');

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
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const replacement of importReplacements) {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        changed = true;
      }
    }

    if (changed) {
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
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Import fix complete! Fixed ${fixedCount} files`);