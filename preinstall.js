const fs = require('fs');
const path = require('path');

// Remove npm and yarn lock files
try {
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
    console.log('Removed package-lock.json');
  }
} catch (e) {
  // ignore
}

try {
  if (fs.existsSync('yarn.lock')) {
    fs.unlinkSync('yarn.lock');
    console.log('Removed yarn.lock');
  }
} catch (e) {
  // ignore
}

// Check if using pnpm
const userAgent = process.env.npm_config_user_agent || '';
if (!userAgent.includes('pnpm')) {
  console.error('Please use pnpm to install dependencies');
  console.error('Install pnpm with: npm install -g pnpm');
  process.exit(1);
}
