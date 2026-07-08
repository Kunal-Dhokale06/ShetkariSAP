const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const workspaceRoot = path.resolve(__dirname, '..', '..');

// Helpful runtime log to confirm Metro loads this file
console.log('[metro.config.cjs] loaded, workspaceRoot=%s', workspaceRoot);

const config = getDefaultConfig(__dirname);

// Watch the workspace root so changes to hoisted packages are picked up
config.watchFolders = Array.from(new Set([...(config.watchFolders || []), workspaceRoot]));

config.resolver = config.resolver || {};

// Include both local and workspace node_modules so Metro can find hoisted packages
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Resolve package locations using Node resolution from the workspace root.
// This handles pnpm's `.pnpm` layout where packages live under
// node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>.
function resolvePkgDir(pkgName) {
  try {
    const pkgJsonPath = require.resolve(pkgName + '/package.json', { paths: [workspaceRoot] });
    return path.dirname(pkgJsonPath);
  } catch (e) {
    // fallback to workspace node_modules if require.resolve fails
    return path.resolve(workspaceRoot, 'node_modules', pkgName);
  }
}

// Try to locate pnpm's hoisted metro-runtime package dir under workspaceRoot/node_modules/.pnpm
function findPnpmMetroRuntimeDir() {
  const pnpmStoreDir = path.resolve(workspaceRoot, 'node_modules', '.pnpm');
  try {
    if (!fs.existsSync(pnpmStoreDir)) return null;
    const entries = fs.readdirSync(pnpmStoreDir);
    for (const e of entries) {
      if (e.startsWith('metro-runtime@')) {
        const candidate = path.join(pnpmStoreDir, e, 'node_modules', 'metro-runtime');
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

const extraNodeModules = new Proxy({}, {
  get: (_, name) => resolvePkgDir(name),
});

// If we can find the pnpm hoisted metro-runtime dir, add it to watchFolders and map it explicitly.
const pnpmMetroDir = findPnpmMetroRuntimeDir();
if (pnpmMetroDir) {
  console.log('[metro.config.cjs] found pnpm metro-runtime dir=%s', pnpmMetroDir);
  config.watchFolders = Array.from(new Set([...(config.watchFolders || []), pnpmMetroDir]));
  extraNodeModules['metro-runtime'] = pnpmMetroDir;
}

config.resolver.extraNodeModules = extraNodeModules;

// Custom resolver: if Metro receives an absolute Windows path as the moduleName
// (which pnpm sometimes produces when packages reference internal files),
// map it directly to the existing file on disk. Otherwise delegate to the
// default resolver from metro-resolver.
try {
  const metroResolver = require('metro-resolver');
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Detect Windows absolute paths like C:\path\to\file.js
    if (typeof moduleName === 'string') {
      if (path.isAbsolute(moduleName) || /^[A-Za-z]:[\\/]/.test(moduleName)) {
        const absPath = moduleName.split('\\').join(path.sep).split('/').join(path.sep);
        if (fs.existsSync(absPath)) {
          return { type: 'sourceFile', filePath: absPath };
        }
      }
      // Also handle paths that include workspaceRoot with mixed slashes
      const normalized = moduleName.split('\\').join(path.sep).split('/').join(path.sep);
      if (normalized.indexOf(workspaceRoot) === 0) {
        if (fs.existsSync(normalized)) return { type: 'sourceFile', filePath: normalized };
      }
    }
    return metroResolver.resolve(context, moduleName, platform);
  };
} catch (e) {
  // If metro-resolver isn't available, skip custom resolve behavior
  console.warn('[metro.config.cjs] metro-resolver not available, skipping custom resolveRequest');
}

// Allow Metro to respect package exports and hierarchical lookup when needed
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enablePackageExports = true;

// Ensure Metro's projectRoot is the mobile app directory so relative
// resolution works the same as running inside the mobile package.
config.projectRoot = path.resolve(__dirname);

module.exports = config;
