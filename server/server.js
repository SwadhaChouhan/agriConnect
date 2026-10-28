import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// ── Route imports ──────────────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// 1. Initialize Express FIRST
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ──────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true, // allow cookies (refresh token) to be sent cross-origin
  })
);
app.use(express.json());          // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());          // REQUIRED: parses req.cookies.refreshToken

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',              authRoutes);
app.use('/api/users',             userRoutes);
app.use('/api/farms',             farmRoutes);
app.use('/api/farms/:farmId/crops', cropRoutes); // nested crop routes
app.use('/api/weather',           weatherRoutes);
app.use('/api/alerts',            alertRoutes);  // 2. Alerts route added here
app.use('/api/consultations',     consultationRoutes);
app.use('/api/products',          productRoutes);
app.use('/api/orders',            orderRoutes);

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'route.not_found' });
});

// ── Global error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'server.internal_error',
  });
});

// ── Connect to MongoDB, then start server ──────────────────────────
const startServer = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌  MONGO_URI is not set. Check your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅  MongoDB connected');

    app.listen(PORT, 'localhost', () => {
      console.log(`🚀  AgriConnect server running on http://localhost:${PORT}`);
      console.log(`    Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`    Database    : MongoDB`);
      console.log(`    Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

startServer();