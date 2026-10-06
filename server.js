require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
connectDB();

// ─────────────────────────────────────────
// ✅ CORS — Allow ALL origins (dev + prod)
// ─────────────────────────────────────────
app.use(
  cors({
    origin: '*',                          // সব origin allow
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: false,                   // ⚠️ '*' এর সাথে credentials: true ব্যবহার করা যায় না
    maxAge: 86400                         // preflight cache 24h
  })
);

// OPTIONS preflight এর জন্য explicit handler
app.options('*', cors());

// ─────────────────────────────────────────
// Cache বন্ধ — যাতে admin panel এ সবসময় ফ্রেশ ডাটা আসে
// ─────────────────────────────────────────
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

app.get('/', (req, res) =>
  res.json({ status: 'ok', message: 'Madrasa API running' })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
