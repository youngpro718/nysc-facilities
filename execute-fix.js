const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fix...');

// Import patterns to fix
const patterns = [
  { find: /from ['"]@\/integrations\/supabase\/client['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/integrations\/supabase\/types['"];?/g, replace: "from '@/types/supabase';" },
  { find: /from ['"]@\/services\/supabase\/supplyRequestService['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]@\/services\/supabase['"];?/g, replace: "from '@/lib/supabase';" },
  { find: /from ['"]\.\.\/integrations\/supabase\/client['"];?/g, replace: "from '@/lib/supabase';" }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(pattern => {
      if (pattern.find.test(content)) {
        content = content.replace(pattern.find, pattern.replace);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
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
    
    if (stat.isDirectory() && !['node_modules', '.git'].includes(file)) {
      walkDir(fullPath);
    } else if (file.match(/\.(ts|tsx)$/)) {
      processFile(fullPath);
    }
  });
}

// Process src directory
walkDir(path.join(__dirname, 'src'));

console.log('✨ Import fix complete!');