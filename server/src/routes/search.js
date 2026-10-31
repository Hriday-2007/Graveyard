import { Router } from 'express';
import { runStartupPipeline } from '../services/pipeline.js';

const router = Router();

/**
 * @route   GET /api/search/stream?q=<name>
 * @desc    Server-Sent Events stream for progressive startup autopsy research
 * @access  Public
 */
router.get('/stream', async (req, res) => {
  const query = (req.query.q || '').trim();

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx proxy buffering if present
  res.flushHeaders?.();

  let isClosed = false;

  const sendEvent = (event, data) => {
    if (isClosed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    if (!isClosed) {
      res.write(': heartbeat\n\n');
    }
  }, 15000);

  res.on('close', () => {
    isClosed = true;
    clearInterval(heartbeat);
  });

  try {
    const result = await runStartupPipeline(query, {
      onProgress: (stage, message) => {
        sendEvent('progress', { stage, message });
      },
    });

    if (isClosed) return;

    if (result.fallback) {
      sendEvent('fallback', result);
      clearInterval(heartbeat);
      return res.end();
    }

    // Relevance pre-check rejected the startup
    if (!result._id || result.notFoundReason) {
      sendEvent('notfound', {
        message: result.notFoundReason || 'Not enough public information found',
      });
      clearInterval(heartbeat);
      isClosed = true;
      return res.end();
    }

    // Success
    sendEvent('progress', { stage: 'done', message: 'Autopsy complete' });
    sendEvent('result', { autopsyId: result._id });
    clearInterval(heartbeat);
    isClosed = true;
    res.end();
  } catch (error) {
    if (isClosed) return;
    clearInterval(heartbeat);

    console.error(`[Search Stream Error] For "${query}":`, error.message);

    const friendlyMessage =
      error.code === 'LLM_UNAVAILABLE'
        ? 'The AI service is unavailable right now. Please try again in a few moments.'
        : 'An error occurred while compiling the autopsy. Please try again.';

    sendEvent('error', { message: friendlyMessage });
    res.end();
  }
});

export default router;
