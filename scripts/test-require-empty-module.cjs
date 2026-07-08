const path = require('path');
const fs = require('fs');

const abs = path.resolve(__dirname, '..', 'node_modules', '.pnpm', 'metro-runtime@0.83.3', 'node_modules', 'metro-runtime', 'src', 'modules', 'empty-module.js');
console.log('Testing path:', abs);
try {
  console.log('existsSync:', fs.existsSync(abs));
  const resolved = require.resolve(abs);
  console.log('require.resolve OK ->', resolved);
  const mod = require(abs);
  console.log('require OK, typeof module:', typeof mod);
} catch (e) {
  console.error('ERROR', e && e.stack);
  process.exit(1);
}
