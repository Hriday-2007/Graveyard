import { GoogleGenAI } from '@google/genai';

const MIN_CALL_GAP_MS = parseInt(process.env.LLM_MIN_GAP_MS || '4000', 10);
const RETRY_DELAYS = [5000, 15000, 30000];

/**
 * Initialize Google GenAI client
 */
function getAIClient() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '').trim();
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured in environment variables.');
    err.code = 'LLM_UNAVAILABLE';
    throw err;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Map friendly model names to active Gemini models if needed
 * @param {string} model
 * @returns {string}
 */
export function resolveModelName(model) {
  const raw = (model || process.env.LLM_MODEL_MAIN || 'gemini-3.5-flash').trim();
  const normalized = raw.toLowerCase().replace(/[\s_]+/g, '-');

  if (normalized === 'gemini-pro') {
    return 'gemini-3.5-flash';
  }
  if (normalized === 'gemini-flash-lite') {
    return 'gemini-3.5-flash-lite';
  }
  if (normalized === 'gemini-flash') {
    return 'gemini-3.5-flash';
  }
  return raw;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Concurrency queue ensuring ONE call at a time with a minimum gap
let queue = Promise.resolve();
let lastCallEndTime = 0;

/**
 * Enqueue an asynchronous action so that exactly one runs at a time
 * with at least MIN_CALL_GAP_MS between calls.
 */
function enqueueCall(fn) {
  return new Promise((resolve, reject) => {
    queue = queue
      .then(async () => {
        try {
          const now = Date.now();
          const elapsed = now - lastCallEndTime;
          if (lastCallEndTime > 0 && elapsed < MIN_CALL_GAP_MS) {
            const waitTime = MIN_CALL_GAP_MS - elapsed;
            await sleep(waitTime);
          }

          const result = await fn();
          lastCallEndTime = Date.now();
          resolve(result);
        } catch (error) {
          lastCallEndTime = Date.now();
          reject(error);
        }
      })
      .catch((fatalErr) => {
        lastCallEndTime = Date.now();
        reject(fatalErr);
      });
  });
}

/**
 * Extract HTTP status code from error object or message
 * @param {any} error
 * @returns {number|null}
 */
function getErrorStatus(error) {
  if (typeof error?.status === 'number') return error.status;
  if (typeof error?.statusCode === 'number') return error.statusCode;
  if (typeof error?.response?.status === 'number') return error.response.status;

  const match = (error?.message || '').match(/"code"\s*:\s*(\d{3})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Check if error is strictly a rate-limit (429) or temporary server overload (503)
 */
function isRetryableError(error) {
  const status = getErrorStatus(error);
  if (status === 429 || status === 503) {
    return true;
  }
  if (status === null) {
    const msg = (error?.message || '').toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('resource_exhausted') ||
      msg.includes('high demand') ||
      msg.includes('unavailable')
    );
  }
  return false;
}

/**
 * Helper to build an LLM_UNAVAILABLE error with a user-friendly message
 */
function createLLMUnavailableError(friendlyMessage, originalError) {
  const err = new Error(friendlyMessage || 'The AI service is unavailable right now');
  err.code = 'LLM_UNAVAILABLE';
  err.originalError = originalError;
  return err;
}

/**
 * Execute an LLM call with up to 3 retries ONLY on 429 and 503 errors.
 * For any other error (400, 401, 403, 404, etc.), do NOT retry; fail immediately,
 * log the full original error message, and throw with code "LLM_UNAVAILABLE".
 */
async function executeWithRetry(callFn) {
  let attempt = 0;

  while (true) {
    try {
      return await callFn();
    } catch (error) {
      if (isRetryableError(error)) {
        if (attempt < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[attempt];
          console.warn(
            `[Gemini Queue] HTTP 429/503 encountered (${error.message?.slice(0, 100)}). Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${RETRY_DELAYS.length})...`
          );
          attempt++;
          await sleep(delay);
        } else {
          // Exceeded retry budget for 429/503
          console.error('[Gemini Queue] Exceeded max retries for busy AI service. Full error:', error.message);
          throw createLLMUnavailableError('The AI is busy, try again in a minute', error);
        }
      } else {
        // Non-retryable error (400, 401, 403, 404, etc.):
        // Do NOT retry; fail immediately, log the full original error message, and throw code "LLM_UNAVAILABLE".
        console.error(
          '[Gemini Client Error] Non-retryable error encountered. Full original error message:',
          error.message,
          error.stack || ''
        );
        throw createLLMUnavailableError('The AI service is unavailable right now', error);
      }
    }
  }
}

/**
 * Call Gemini expecting JSON output.
 *
 * @param {{ model?: string, system: string, user: string }} options
 * @returns {Promise<any>}
 */
export async function callJSON({ model, system, user }) {
  return enqueueCall(async () => {
    return executeWithRetry(async () => {
      const ai = getAIClient();
      const targetModel = resolveModelName(model || process.env.LLM_MODEL_MAIN);

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: user,
        config: {
          systemInstruction: system,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const rawText = response.text || '';
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      if (!cleaned) {
        throw new Error('Gemini returned an empty response.');
      }

      try {
        return JSON.parse(cleaned);
      } catch (parseErr) {
        throw new Error(
          `Failed to parse Gemini JSON output: ${parseErr.message}. Content snippet: "${cleaned.slice(0, 200)}"`
        );
      }
    });
  });
}

/**
 * Call Gemini expecting plain text output.
 *
 * @param {{ model?: string, system: string, user: string }} options
 * @returns {Promise<string>}
 */
export async function callText({ model, system, user }) {
  return enqueueCall(async () => {
    return executeWithRetry(async () => {
      const ai = getAIClient();
      const targetModel = resolveModelName(model || process.env.LLM_MODEL_FAST);

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: user,
        config: {
          systemInstruction: system,
          temperature: 0.2,
        },
      });

      return (response.text || '').trim();
    });
  });
}
