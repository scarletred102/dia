import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const platforms = {
  web: {
    build: 'dist',
    deploy: 'gh-pages',
    config: {
      base: '/web3-digital-identity/',
    },
  },
  electron: {
    build: 'dist-electron',
    deploy: 'electron-builder',
    config: {
      base: './',
    },
  },
};

async function deploy() {
  try {
    // Read package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const platform = process.argv[2] || 'web';

    if (!platforms[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Deploying to ${platform}...`);

    // Update vite config for platform
    const viteConfig = readFileSync('vite.config.ts', 'utf8');
    const updatedConfig = viteConfig.replace(
      /base: ['"].*['"]/,
      `base: '${platforms[platform].config.base}'`
    );
    writeFileSync('vite.config.ts', updatedConfig);

    // Build the application
    console.log('Building application...');
    execSync('npm run build:prod', { stdio: 'inherit' });

    // Platform-specific deployment
    switch (platform) {
      case 'web':
        // Deploy to GitHub Pages
        console.log('Deploying to GitHub Pages...');
        execSync('npm run gh-pages', { stdio: 'inherit' });
        break;

      case 'electron':
        // Build Electron app
        console.log('Building Electron app...');
        execSync('npm run electron:build', { stdio: 'inherit' });
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Restore original vite config
    writeFileSync('vite.config.ts', viteConfig);

    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy(); 