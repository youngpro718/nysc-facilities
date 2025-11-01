#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fix...');

// Define what imports to replace
const replacements = [
  { find: /from ['"]@\/integrations\/supabase\/client['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/integrations\/supabase\/types['"];?/g, replace: "from '@/types/supabase';" },
  { find: /from ['"]@\/services\/supabase\/supplyRequestService['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/services\/supabase['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]\.\.\/integrations\/supabase\/client['"];?/g, replace: "from '@/lib/supabase';" }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const { find, replace } of replacements) {
      if (find.test(content)) {
        content = content.replace(find, replace);
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
    console.error(`❌ Error: ${filePath} - ${error.message}`);
    return false;
  }
}

function walkDirectory(dir) {
  const items = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(item)) {
      fixedCount += walkDirectory(fullPath);
    } else if (item.match(/\.(ts|tsx)$/)) {
      if (processFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Start processing from src directory
const srcDir = path.join(process.cwd(), 'src');
const fixedCount = walkDirectory(srcDir);

console.log(`✨ Import fix complete! Fixed ${fixedCount} files`);

// Now run node to execute this script
const { execSync } = require('child_process');
try {
  execSync('echo "Script executed successfully"', { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error.message);
}