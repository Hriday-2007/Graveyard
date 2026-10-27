/**
 * Global Express Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Server Error] [${err.code || 'ERROR'}] ${err.message}`, err.originalError || err.stack || err);

  // Map LLM_UNAVAILABLE to a friendly user-facing message and 503 status
  if (err.code === 'LLM_UNAVAILABLE') {
    return res.status(503).json({
      success: false,
      code: 'LLM_UNAVAILABLE',
      message: 'The AI service is unavailable right now',
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
