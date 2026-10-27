/**
 * Format a cause slug like "no-market-need" into "No market need"
 * @param {string} tag
 * @returns {string}
 */
export function formatCauseTag(tag) {
  if (!tag) return 'Unknown';
  // If it's already a sentence, truncate slightly or return capitalized
  if (tag.includes(' ') && !tag.includes('-')) {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }
  const words = tag.split('-').map((w) => w.toLowerCase());
  if (words.length === 0) return tag;
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Format active years string like "2018 to 2020" or "Died 2020"
 * @param {number|null} foundedYear
 * @param {number|null} diedYear
 * @returns {string}
 */
export function formatYears(foundedYear, diedYear) {
  if (foundedYear && diedYear) {
    return `${foundedYear} to ${diedYear}`;
  }
  if (diedYear) {
    return `Died in ${diedYear}`;
  }
  if (foundedYear) {
    return `Founded in ${foundedYear}`;
  }
  return 'Dates Unknown';
}

/**
 * Get styling for confidence levels
 * @param {'high'|'medium'|'low'} confidence
 */
export function getConfidenceBadge(confidence) {
  const norm = (confidence || 'medium').toLowerCase();
  switch (norm) {
    case 'high':
      return {
        label: 'High Confidence',
        classes: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
        dot: 'bg-emerald-400',
        description: 'Verified across multiple independent news sources and factual records.',
      };
    case 'low':
      return {
        label: 'Low Confidence',
        classes: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
        dot: 'bg-rose-400',
        description: 'Sparse or conflicting public records; some claims may be speculative.',
      };
    case 'medium':
    default:
      return {
        label: 'Medium Confidence',
        classes: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
        dot: 'bg-amber-400',
        description: 'Sufficient source consensus with minor gaps in founder commentary or records.',
      };
  }
}

/**
 * Get styling and label for claim types
 * @param {'founder-stated'|'press-reported'|'inferred'} type
 */
export function getClaimTypeBadge(type) {
  switch (type) {
    case 'founder-stated':
      return {
        label: 'Founder stated',
        classes: 'bg-sky-950/70 text-sky-300 border-sky-800/50',
      };
    case 'press-reported':
      return {
        label: 'Press reported',
        classes: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
      };
    case 'inferred':
    default:
      return {
        label: 'Inferred',
        classes: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
      };
  }
}
