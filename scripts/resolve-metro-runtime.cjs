const fs = require('fs');
try {
  const pkg = require.resolve('metro-runtime', { paths: [process.cwd()] });
  const pkgDir = require('path').dirname(pkg);
  const candidate = require('path').join(pkgDir, 'src', 'modules', 'empty-module.js');
  if (fs.existsSync(candidate)) {
    console.log(candidate);
  } else {
    console.error('ERROR_NOT_FOUND', candidate);
    process.exit(1);
  }
} catch (e) {
  console.error('ERROR_RESOLVE', e && e.message);
  process.exit(1);
}
