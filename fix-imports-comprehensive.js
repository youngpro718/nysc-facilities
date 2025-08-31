const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive import fix...');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanged = false;

    // Fix primary supabase client imports
    const oldClientImport = /from ['"]@\/integrations\/supabase\/client['"]/g;
    if (oldClientImport.test(content)) {
      content = content.replace(oldClientImport, "from '@/lib/supabase'");
      hasChanged = true;
    }

    // Fix services imports
    const oldServicesImport = /from ['"]@\/services\/supabase\/lightingService['"]/g;
    if (oldServicesImport.test(content)) {
      content = content.replace(oldServicesImport, "from '@/services/supabase/lightingService'");
      hasChanged = true;
    }

    const oldServicesIndexImport = /from ['"]@\/services\/supabase['"]/g;
    if (oldServicesIndexImport.test(content)) {
      content = content.replace(oldServicesIndexImport, "from '@/services/supabase'");
      hasChanged = true;
    }

    if (hasChanged) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript files in src directory
const srcPath = './src';
const allFiles = getAllFiles(srcPath);

console.log(`📂 Found ${allFiles.length} TypeScript files`);

let fixedCount = 0;
allFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Import fix complete! Fixed ${fixedCount} files.`);
console.log('✨ All imports should now resolve correctly.');