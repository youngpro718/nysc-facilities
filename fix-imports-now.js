const { execSync } = require('child_process');

try {
  console.log('🚀 Running final import fix...');
  execSync('node fix-all-imports.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running fix script:', error.message);
}