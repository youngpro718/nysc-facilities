const fs = require('fs');
const path = require('path');

console.log('🔧 Starting automated import fix for ALL remaining files...');

// Import patterns to fix - comprehensive list
const patterns = [
  // Fix integrations imports to use lib
  { find: /from ['"]@\/integrations\/supabase\/client['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/integrations\/supabase\/types['"];?/g, replace: "from '@/types/supabase';" },
  
  // Remove old service imports that don't exist anymore
  { find: /import .* from ['"]@\/services\/supabase\/supplyRequestService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase\/authService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase\/keyRequestService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase\/lightingService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase['"];?\s*\n/g, replace: '' },
  
  // Fix other service path references
  { find: /from ['"]@\/services\/supabase\/supplyRequestService['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/services\/supabase\/authService['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/services\/supabase\/keyRequestService['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/services\/supabase\/lightingService['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/services\/supabase['"];?/g, replace: "from '@/lib/supabase';" },
  
  // Clean up any leftover exports
  { find: /export .* from ['"]@\/services\/supabase\/.*['"];?\s*\n/g, replace: '' },
  
  // Fix specific function calls
  { find: /\{ ([^}]*) \} from ['"]@\/services\/supabase\/supplyRequestService['"];?/g, replace: "{ $1 } from '@/lib/supabase';" },
];

let totalFixed = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let originalContent = content;

    patterns.forEach(pattern => {
      const matches = content.match(pattern.find);
      if (matches) {
        content = content.replace(pattern.find, pattern.replace);
        modified = true;
      }
    });

    // Clean up multiple consecutive newlines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    // Clean up empty import sections and lines with just semicolons
    content = content.replace(/import \{ \} from.*;\s*\n/g, '');
    content = content.replace(/^;\s*\n/gm, '');

    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error: ${filePath} - ${error.message}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(file)) {
      walkDir(fullPath);
    } else if (file.match(/\.(ts|tsx)$/)) {
      processFile(fullPath);
    }
  });
}

// Process src directory
walkDir(path.join(__dirname, 'src'));

console.log(`✨ Automated import fix complete! Fixed ${totalFixed} files.`);