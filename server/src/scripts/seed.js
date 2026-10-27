import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Autopsy } from '../models/Autopsy.js';
import { runStartupPipeline } from '../services/pipeline.js';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SEED_STARTUPS = ['Quibi', 'Vine', 'Juicero', 'Google Plus', 'Fab'];
const PAUSE_BETWEEN_STARTUPS_MS = 20000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seed() {
  console.log('========================================================');
  console.log(' 🪦  Startup Graveyard Database Seeder');
  console.log('========================================================\n');

  await connectDB();

  console.log(`\nStarting pipeline for ${SEED_STARTUPS.length} startups...\n`);

  const results = {
    succeeded: [],
    skipped: [],
    failed: [],
  };

  for (let i = 0; i < SEED_STARTUPS.length; i++) {
    const name = SEED_STARTUPS[i];
    const normalizedName = name.toLowerCase().trim();

    console.log(`\n--------------------------------------------------------`);
    console.log(`[${i + 1}/${SEED_STARTUPS.length}] Checking: "${name}"`);
    console.log(`--------------------------------------------------------`);

    try {
      const existing = await Autopsy.findOne({ normalizedName });
      if (existing) {
        console.log(`[Seed] ⏩ Skipping "${name}" — already exists in MongoDB.`);
        results.skipped.push(name);
        continue;
      }

      console.log(`[Seed] 🚀 Running autopsy pipeline for "${name}"...`);
      const autopsy = await runStartupPipeline(name);

      console.log(`[Seed] ✅ Succeeded for "${name}"!`);
      console.log(`       Epitaph: "${autopsy.epitaph}"`);
      console.log(`       Confidence: ${autopsy.confidence} | Causes: ${autopsy.causes.length} | Sources: ${autopsy.sources.length}`);
      results.succeeded.push(name);

      // 20-second pause between startups to respect free-tier rate limits
      if (i < SEED_STARTUPS.length - 1) {
        console.log(`[Seed] ⏳ Pausing ${PAUSE_BETWEEN_STARTUPS_MS / 1000}s before next startup to respect rate limits...`);
        await sleep(PAUSE_BETWEEN_STARTUPS_MS);
      }
    } catch (err) {
      console.error(`[Seed] ❌ Failed to archive "${name}":`, err.message);
      results.failed.push({ name, error: err.message });
      // Continue with next startup after failure
      if (i < SEED_STARTUPS.length - 1) {
        console.log(`[Seed] ⏳ Pausing ${PAUSE_BETWEEN_STARTUPS_MS / 1000}s before next startup...`);
        await sleep(PAUSE_BETWEEN_STARTUPS_MS);
      }
    }
  }

  console.log('\n========================================================');
  console.log(' 📊 Seeding Summary');
  console.log('========================================================');
  console.log(`  • Succeeded: ${results.succeeded.length} (${results.succeeded.join(', ') || 'none'})`);
  console.log(`  • Skipped:   ${results.skipped.length} (${results.skipped.join(', ') || 'none'})`);
  console.log(`  • Failed:    ${results.failed.length} (${results.failed.map((f) => f.name).join(', ') || 'none'})`);
  console.log('========================================================\n');

  await mongoose.connection.close();
  console.log('[Seed] Database connection closed.');
}

seed().catch(async (err) => {
  console.error('[Seed Fatal Error]:', err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
