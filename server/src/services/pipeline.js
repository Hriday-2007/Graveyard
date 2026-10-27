import { Autopsy } from '../models/Autopsy.js';
import { collectSources } from './sources/collectSources.js';
import { analyzeStartup } from './llm/analyze.js';
import { verifyClaims } from './llm/verify.js';

/**
 * Normalize text for case-insensitive matching:
 * - lowercase
 * - replace '+' with ' plus '
 * - strip punctuation
 * - collapse spaces
 * @param {string} text
 * @returns {string}
 */
export function normalizeTextForMatching(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if source text or title contains the startup name:
 * 1. Exact normalized substring match
 * 2. All main tokens (longer than 2 chars) appear in the source text
 * @param {string} sourceText
 * @param {string} startupName
 * @returns {boolean}
 */
export function matchesStartupName(sourceText, startupName) {
  const normSource = normalizeTextForMatching(sourceText);
  const normName = normalizeTextForMatching(startupName);

  if (!normSource || !normName) return false;

  // Exact normalized match (e.g. 'google plus' in text matches both 'Google+' and 'Google Plus')
  if (normSource.includes(normName)) {
    return true;
  }

  // Token-based matching: all tokens longer than 2 characters must appear in the source
  const mainTokens = normName.split(' ').filter((token) => token.length > 2);
  if (mainTokens.length > 0 && mainTokens.every((token) => normSource.includes(token))) {
    return true;
  }

  return false;
}

/**
 * Run the full 2-call LLM autopsy pipeline for a startup.
 *
 * Steps:
 * 1. Check MongoDB cache for existing autopsy by normalizedName
 * 2. Collect public sources (Tavily, Wikipedia, Hacker News)
 * 3. Relevance pre-check: Count sources mentioning the startup name. If < 2, return low confidence without saving.
 * 4. Step 1 LLM: Perform post-mortem analysis (includes epitaph)
 * 5. Step 2 LLM: Batch verify claims and verify founder quotes
 * 6. Persist to MongoDB Atlas
 *
 * @param {string} startupName
 * @param {{ forceRefresh?: boolean, onProgress?: (stage: string, message: string) => void }} [options]
 * @returns {Promise<any>}
 */
export async function runStartupPipeline(startupName, options = {}) {
  const cleanName = (startupName || '').trim();
  if (!cleanName) {
    throw new Error('Startup name must not be empty.');
  }

  const normalizedName = cleanName.toLowerCase();
  const reportProgress = (stage, message) => {
    if (typeof options.onProgress === 'function') {
      try {
        options.onProgress(stage, message);
      } catch (_) {}
    }
  };

  // Step 1: Check MongoDB cache
  if (!options.forceRefresh) {
    const cached = await Autopsy.findOne({ normalizedName });
    if (cached) {
      console.log(`[Pipeline] Cache HIT for "${cleanName}" in MongoDB.`);
      reportProgress('done', 'Loaded from archives');
      return cached;
    }
  }

  console.log(`[Pipeline] Cache MISS for "${cleanName}". Starting autopsy pipeline...`);
  reportProgress('searching', 'Searching public sources...');

  // Step 2: Source collection
  console.log(`[Pipeline] Collecting public intelligence from Tavily, Wikipedia, Hacker News...`);
  const collected = await collectSources(cleanName);

  if (!collected.sources || collected.sources.length === 0) {
    throw new Error(`No reliable public sources found for "${cleanName}". Cannot perform autopsy.`);
  }

  console.log(
    `[Pipeline] Collected ${collected.sources.length} sources (Tavily: ${collected.counts.tavily}, Wiki: ${collected.counts.wikipedia}, HN: ${collected.counts.hackernews})`
  );

  reportProgress('reading', 'Reading and filtering sources...');

  // Step 3: Relevance pre-check
  // Count sources whose text or title mentions the normalized startup name
  const relevantSourcesCount = (collected.sources || []).filter((s) => {
    return matchesStartupName(s.text, cleanName) || matchesStartupName(s.title, cleanName);
  }).length;

  console.log(`[Pipeline] Relevance pre-check: ${relevantSourcesCount} source(s) mention "${cleanName}".`);

  // If fewer than 2 relevant sources mention the name, skip LLM and do NOT save to MongoDB
  if (relevantSourcesCount < 2) {
    console.warn(`[Pipeline] Fewer than 2 sources mention "${cleanName}". Skipping LLM analysis and skipping DB save.`);
    return {
      startupName: cleanName,
      normalizedName,
      industry: 'Other',
      foundedYear: null,
      diedYear: null,
      summary: 'Not enough public information found to generate a reliable autopsy.',
      epitaph: 'Vanished without enough public record.',
      causes: ['other'],
      causeDetails: 'Not enough public records or failure post-mortems available to establish causes.',
      timeline: [],
      founderQuotes: [],
      claims: [],
      sources: collected.sources || [],
      confidence: 'low',
      notFoundReason: 'Not enough public information found',
    };
  }

  // Step 4: LLM Call 1 - Comprehensive Autopsy & Epitaph Analysis
  reportProgress('analyzing', 'Analyzing post-mortem with AI...');
  const analysis = await analyzeStartup(collected);

  // Step 5: LLM Call 2 - Fast Batched Claim & Quote Verification
  reportProgress('verifying', 'Fact-checking claims and founder statements...');
  const verified = await verifyClaims(analysis, collected);

  // Step 6: Format and save to MongoDB
  const mappedSources = collected.sources.map((s) => ({
    title: s.title || 'Source',
    url: s.url || '',
    origin: s.origin || 'tavily',
  }));

  const autopsyData = {
    startupName: verified.startupName || cleanName,
    normalizedName,
    industry: verified.industry || 'Other',
    foundedYear: verified.foundedYear || null,
    diedYear: verified.diedYear || null,
    summary: verified.summary || '',
    epitaph: verified.epitaph || '',
    causes: verified.causes || [],
    causeDetails: verified.causeDetails || '',
    timeline: verified.timeline || [],
    founderQuotes: verified.founderQuotes || [],
    claims: verified.claims || [],
    sources: mappedSources,
    confidence: verified.confidence || 'medium',
    notFoundReason: verified.notFoundReason || '',
  };

  const savedAutopsy = await Autopsy.findOneAndUpdate(
    { normalizedName },
    autopsyData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[Pipeline] Autopsy for "${cleanName}" successfully generated and saved to MongoDB.`);
  reportProgress('done', 'Autopsy complete');
  return savedAutopsy;
}

export default runStartupPipeline;
