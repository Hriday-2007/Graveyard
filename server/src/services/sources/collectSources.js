import { searchTavily } from './tavilySource.js';
import { fetchWikipedia } from './wikipediaSource.js';
import { searchHN } from './hackerNewsSource.js';

const MAX_PER_SOURCE_CHARS = 4000;
const MAX_TOTAL_CHARS = 30000;

/**
 * Collect public intelligence about a startup from Tavily, Wikipedia, and Hacker News.
 *
 * @param {string} startupName
 * @returns {Promise<{
 *   startupName: string,
 *   sources: Array<{ title: string, url: string, text: string, origin: 'tavily' | 'wikipedia' | 'hackernews' }>,
 *   counts: { tavily: number, wikipedia: number, hackernews: number }
 * }>}
 */
export async function collectSources(startupName) {
  const cleanName = (startupName || '').trim();

  // Run all three source collectors concurrently
  const [tavilyResults, wikiResults, hnResults] = await Promise.all([
    searchTavily(cleanName),
    fetchWikipedia(cleanName),
    searchHN(cleanName),
  ]);

  const counts = {
    tavily: tavilyResults.length,
    wikipedia: wikiResults.length,
    hackernews: hnResults.length,
  };

  const allSources = [...tavilyResults, ...wikiResults, ...hnResults];

  // Deduplicate by URL (normalized) and strip empty content
  const seenUrls = new Set();
  const dedupedSources = [];

  for (const item of allSources) {
    const rawText = (item.text || '').trim();
    if (!rawText) continue;

    const normalizedUrl = (item.url || '').toLowerCase().trim();
    if (normalizedUrl && seenUrls.has(normalizedUrl)) {
      continue;
    }

    if (normalizedUrl) {
      seenUrls.add(normalizedUrl);
    }

    // Trim individual text to max ~4000 characters
    const trimmedText = rawText.length > MAX_PER_SOURCE_CHARS
      ? rawText.slice(0, MAX_PER_SOURCE_CHARS) + '...'
      : rawText;

    dedupedSources.push({
      title: item.title,
      url: item.url,
      text: trimmedText,
      origin: item.origin,
    });
  }

  // Cap total combined text to ~30,000 characters
  const finalSources = [];
  let currentTotalChars = 0;

  for (const source of dedupedSources) {
    if (currentTotalChars >= MAX_TOTAL_CHARS) {
      break;
    }

    const availableChars = MAX_TOTAL_CHARS - currentTotalChars;

    if (source.text.length <= availableChars) {
      finalSources.push(source);
      currentTotalChars += source.text.length;
    } else if (availableChars > 150) {
      // If there's still meaningful room left, include a trimmed portion of this source
      finalSources.push({
        ...source,
        text: source.text.slice(0, availableChars) + '... [truncated]',
      });
      currentTotalChars += availableChars;
      break;
    }
  }

  return {
    startupName: cleanName,
    sources: finalSources,
    counts,
  };
}

export default collectSources;
