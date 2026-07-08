const path = require('path');
try {
  const resolved = require.resolve('metro-runtime/src/modules/empty-module.js', { paths: [process.cwd()] });
  console.log(resolved);
} catch (e) {
  console.error('ERROR_RESOLVE', e && e.message);
  process.exit(1);
}
