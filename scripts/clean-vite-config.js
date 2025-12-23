/**
 * Clean generated vite config files
 * Vite should only use vite.config.ts, not compiled .js/.mjs/.mts files
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const filesToDelete = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.mts'
];

async function cleanViteConfig() {
  try {
    let deletedCount = 0;
    
    for (const file of filesToDelete) {
      const filePath = join(rootDir, file);
      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log(`🗑️  Deleted ${file}`);
        deletedCount++;
      }
    }

    if (deletedCount === 0) {
      console.log('✓ No generated vite config files found');
    } else {
      console.log(`✅ Cleaned ${deletedCount} generated vite config file(s)`);
    }
  } catch (error) {
    console.error('❌ Failed to clean vite config files:', error.message);
    // Don't exit with error, just warn
    console.warn('⚠️  Continuing anyway...');
  }
}

cleanViteConfig();

