/**
 * Copy assets from src/assets to public/assets before build
 * This ensures Vite will include them in the dist folder
 */

import { cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcAssetsDir = join(__dirname, '..', 'src', 'assets');
const publicAssetsDir = join(__dirname, '..', 'public', 'assets');

async function copyAssets() {
  try {
    console.log('📦 Copying assets from src/assets to public/assets...');

    // Create public/assets directory if it doesn't exist
    if (!existsSync(publicAssetsDir)) {
      await mkdir(publicAssetsDir, { recursive: true });
      console.log('✓ Created public/assets directory');
    }

    // Copy all files from src/assets to public/assets
    await cp(srcAssetsDir, publicAssetsDir, {
      recursive: true,
      force: true
    });

    console.log('✅ Assets copied successfully!');
  } catch (error) {
    console.error('❌ Failed to copy assets:', error.message);
    process.exit(1);
  }
}

copyAssets();

