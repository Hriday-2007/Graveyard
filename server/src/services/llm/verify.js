import { callJSON } from './client.js';

const SYSTEM_VERIFY_PROMPT = `You are a strict factual fact-checker.
Your job is to verify whether each claim extracted from public articles is directly supported by the provided source texts.

For each claim:
- Set verified to true ONLY if the cited source text explicitly backs up the stated fact, number, or event.
- Set verified to false if the source text does not mention it, contradicts it, or if it is speculative.

Return JSON in this exact shape:
{
  "verifications": [
    { "index": 0, "verified": true, "reason": "Explicitly confirmed in source" },
    { "index": 1, "verified": false, "reason": "Not stated in cited source" }
  ]
}`;

/**
 * Verify quotes using normalized plain code substring matching.
 * Quotes that cannot be found in the collected sources are dropped.
 */
function verifyAndFilterFounderQuotes(quotes, sources) {
  if (!quotes || quotes.length === 0) return [];

  // Normalize all source texts into one searchable string
  const normalizedCorpus = sources
    .map((s) => s.text || '')
    .join(' ')
    .toLowerCase()
    .replace(/['"“”‘’`]/g, '')
    .replace(/\s+/g, ' ');

  const validQuotes = [];

  for (const item of quotes) {
    if (!item?.quote) continue;

    const normalizedQuote = item.quote
      .toLowerCase()
      .replace(/['"“”‘’`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check exact or partial substring (first 40 characters for long quotes)
    const checkSnippet = normalizedQuote.length > 50
      ? normalizedQuote.slice(0, 50)
      : normalizedQuote;

    if (normalizedCorpus.includes(checkSnippet)) {
      validQuotes.push(item);
    } else {
      console.warn(`[Verify] Dropped ungrounded founder quote: "${item.quote.slice(0, 60)}..."`);
    }
  }

  return validQuotes;
}

/**
 * Verify claims with a single batched fast LLM call and verify quotes with code.
 *
 * @param {object} analysis - Parsed analysis object
 * @param {{ startupName: string, sources: Array<{ title: string, url: string, text: string }> }} collected
 * @returns {Promise<object>} Verified and adjusted analysis object
 */
export async function verifyClaims(analysis, collected) {
  const model = process.env.LLM_MODEL_FAST;
  const verifiedAnalysis = { ...analysis };

  // 1. Plain code verification of founder quotes
  verifiedAnalysis.founderQuotes = verifyAndFilterFounderQuotes(
    analysis.founderQuotes || [],
    collected.sources || []
  );

  const claims = analysis.claims || [];
  if (claims.length === 0) {
    return verifiedAnalysis;
  }

  // 2. Batched LLM call to verify claims
  try {
    const claimsPayload = claims.map((c, index) => ({
      index,
      text: c.text,
      sourceUrl: c.sourceUrl,
      type: c.type,
    }));

    const userPrompt = `Sources Available:\n${JSON.stringify(
      collected.sources.map((s) => ({ url: s.url, title: s.title, snippet: s.text.slice(0, 2000) })),
      null,
      2
    )}\n\nClaims to Verify:\n${JSON.stringify(claimsPayload, null, 2)}`;

    console.log(`[LLM Verify] Verifying ${claims.length} claims for "${collected.startupName}" using ${model || 'default fast model'}...`);

    const result = await callJSON({
      model,
      system: SYSTEM_VERIFY_PROMPT,
      user: userPrompt,
    });

    const verificationMap = new Map();
    if (Array.isArray(result?.verifications)) {
      result.verifications.forEach((v) => {
        verificationMap.set(v.index, Boolean(v.verified));
      });
    }

    // Apply verification flags
    verifiedAnalysis.claims = claims.map((claim, index) => ({
      ...claim,
      verified: verificationMap.has(index) ? verificationMap.get(index) : false,
    }));
  } catch (error) {
    // If the fast LLM call fails after retries, do NOT fail the pipeline:
    // mark all claims verified:false, set confidence to at most "medium", and continue.
    console.warn(
      `[LLM Verify Warning] Verification call failed (${error.message}). Continuing with unverified claims and capped confidence.`
    );

    verifiedAnalysis.claims = claims.map((claim) => ({
      ...claim,
      verified: false,
    }));

    if (verifiedAnalysis.confidence === 'high') {
      verifiedAnalysis.confidence = 'medium';
    }

    return verifiedAnalysis;
  }

  // 3. Downgrade confidence if > 40% of claims are unsupported
  const totalClaims = verifiedAnalysis.claims.length;
  if (totalClaims > 0) {
    const unverifiedCount = verifiedAnalysis.claims.filter((c) => !c.verified).length;
    const unverifiedRatio = unverifiedCount / totalClaims;

    if (unverifiedRatio > 0.4) {
      console.warn(
        `[Verify] ${(unverifiedRatio * 100).toFixed(1)}% of claims unverified for "${collected.startupName}". Downgrading confidence.`
      );
      if (verifiedAnalysis.confidence === 'high') {
        verifiedAnalysis.confidence = 'medium';
      } else if (verifiedAnalysis.confidence === 'medium') {
        verifiedAnalysis.confidence = 'low';
      }
    }
  }

  return verifiedAnalysis;
}

export default verifyClaims;
