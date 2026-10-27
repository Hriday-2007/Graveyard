import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { runStartupPipeline } from '../services/pipeline.js';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Parse command line arguments
// e.g. node src/scripts/testPipeline.js "Quibi" --force
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const startupName = args[0] || 'Quibi';
const forceRefresh = process.argv.includes('--force') || process.argv.includes('-f');

async function testPipeline() {
  console.log('========================================================');
  console.log(` 🪦  Startup Graveyard Pipeline Test: "${startupName}"`);
  console.log(`     Mode: ${forceRefresh ? 'FORCE REFRESH (Bypassing DB cache, calling Gemini)' : 'STANDARD (Checks DB cache first)'}`);
  console.log('========================================================\n');

  await connectDB();

  const startTime = Date.now();
  try {
    const autopsy = await runStartupPipeline(startupName, { forceRefresh });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n========================================================`);
    console.log(` ✅ Autopsy Result for "${autopsy.startupName}" (completed in ${duration}s)`);
    console.log(`========================================================`);
    console.log(` • MongoDB ID:   ${autopsy._id || 'Not stored (relevance pre-check rejected)'}`);
    console.log(` • Industry:     ${autopsy.industry}`);
    console.log(` • Active Years: ${autopsy.foundedYear || 'Unknown'} - ${autopsy.diedYear || 'Unknown'}`);
    console.log(` • Epitaph:      "${autopsy.epitaph}"`);
    console.log(` • Confidence:   ${autopsy.confidence?.toUpperCase() || 'UNKNOWN'}`);
    if (autopsy.notFoundReason) {
      console.log(` • Reason:       ${autopsy.notFoundReason}`);
    }
    console.log(` • Causes (${autopsy.causes?.length || 0}):`);
    (autopsy.causes || []).forEach((c, i) => console.log(`     ${i + 1}. ${c}`));
    if (autopsy.causeDetails) {
      console.log(` • Cause Details: "${autopsy.causeDetails}"`);
    }
    console.log(` • Claims (${autopsy.claims.length}):`);
    autopsy.claims.forEach((cl, i) => {
      console.log(`     ${i + 1}. [${cl.verified ? 'VERIFIED' : 'UNVERIFIED'}] (${cl.type}) ${cl.text}`);
    });
    console.log(` • Founder Quotes: ${autopsy.founderQuotes.length}`);
    autopsy.founderQuotes.forEach((q, i) => {
      console.log(`     ${i + 1}. "${q.quote}" — ${q.attribution || 'Founder'}`);
    });
    const isStored = Boolean(autopsy._id);
    console.log(` • Sources:      ${autopsy.sources?.length || 0} ${isStored ? 'sources stored in MongoDB' : 'sources not stored'}`);
    console.log('========================================================\n');
  } catch (error) {
    console.error(`\n❌ Pipeline failed:`, error.message);
  } finally {
    await mongoose.connection.close();
    console.log('[Pipeline Test] Database connection closed.');
  }
}

testPipeline();
