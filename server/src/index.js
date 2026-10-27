import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import rateLimit from 'express-rate-limit';
import healthRoute from './routes/health.js';
import autopsiesRoute from './routes/autopsies.js';
import searchRoute from './routes/search.js';
import statsRoute from './routes/stats.js';
import { errorHandler } from './middleware/errorHandler.js';

// Resolve directory path & load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to MongoDB Atlas
connectDB();

// CORS configuration limited to CLIENT_URL
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Body parser & request logger
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// API Routes
app.use('/api/health', healthRoute);
app.use('/api/autopsies', autopsiesRoute);
app.use('/api/search', searchRoute);
app.use('/api/stats', statsRoute);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`[Server] Accepting CORS from: ${CLIENT_URL}`);
});
