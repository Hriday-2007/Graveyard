import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { collectSources } from '../services/sources/collectSources.js';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const startupName = process.argv[2] || 'Quibi';

async function run() {
  console.log(`\n======================================================`);
  console.log(` 🪦 Testing Source Collectors for: "${startupName}"`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  const result = await collectSources(startupName);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`Fetched in ${duration}s`);
  console.log(`\nSource Counts by Origin:`);
  console.log(`  • Tavily:       ${result.counts.tavily}`);
  console.log(`  • Wikipedia:    ${result.counts.wikipedia}`);
  console.log(`  • Hacker News:  ${result.counts.hackernews}`);
  console.log(`  • Total usable sources: ${result.sources.length}\n`);

  console.log(`--- Sources Preview ---`);
  if (result.sources.length === 0) {
    console.log(`No sources found for "${startupName}".`);
  } else {
    result.sources.forEach((source, index) => {
      console.log(`\n[${index + 1}] [${source.origin.toUpperCase()}] ${source.title}`);
      console.log(`    URL: ${source.url}`);
      console.log(`    Snippet (first 200 chars):`);
      console.log(`    "${source.text.slice(0, 200).replace(/\n/g, ' ')}..."`);
    });
  }

  console.log(`\n======================================================\n`);
}

run().catch((err) => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
