const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fix for remaining files...');

// Import patterns to fix - comprehensive list
const patterns = [
  // Remove old service imports that don't exist
  { find: /import .* from ['"]@\/services\/supabase\/supplyRequestService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase\/authService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase\/keyRequestService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase\/lightingService['"];?\s*\n/g, replace: '' },
  { find: /import .* from ['"]@\/services\/supabase['"];?\s*\n/g, replace: '' },
  
  // Fix remaining integrations imports to use lib
  { find: /from ['"]@\/integrations\/supabase\/client['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/integrations\/supabase\/types['"];?/g, replace: "from '@/types/supabase';" },
  
  // Fix export patterns
  { find: /export .* from ['"]@\/services\/supabase\/supplyRequestService['"];?\s*\n/g, replace: '' },
  { find: /export .* from ['"]@\/services\/supabase\/authService['"];?\s*\n/g, replace: '' },
  { find: /export .* from ['"]@\/services\/supabase\/keyRequestService['"];?\s*\n/g, replace: '' },
  { find: /export .* from ['"]@\/services\/supabase\/lightingService['"];?\s*\n/g, replace: '' },
  
  // Fix specific import combinations
  { find: /import \{ ([^}]+) \} from ['"]@\/services\/supabase\/supplyRequestService['"];?/g, replace: "// Supply request functions now available through @/lib/supabase" },
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
    
    // Clean up empty import sections
    content = content.replace(/import \{ \} from.*;\s*\n/g, '');

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

console.log(`✨ Import fix complete! Fixed ${totalFixed} files.`);