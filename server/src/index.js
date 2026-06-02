const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const chatRouter = require('./routes/chat');

const app = express();

// CORS origin checker and filter middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server or test requests (like curl, postman, or internal server calls)
    if (!origin) {
      return callback(null, true);
    }

    // Allow any local development origin
    if (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') || 
      config.allowedOrigins.indexOf(origin) !== -1
    ) {
      return callback(null, true);
    }

    console.warn(`Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error('Blocked by CORS origin restrictions. Only Vite origins and local dev ports are authorized.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Mount global middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (index.html, style.css, app.js) from the project root
app.use(express.static(path.join(__dirname, '../../')));

// Standard GET /health route
app.use('/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    uptime: `${process.uptime().toFixed(1)}s`,
    timestamp: new Date().toISOString(),
    service: 'Claude AI Backend Server'
  });
});

// Mount modular endpoints
app.use('/api', chatRouter);

// Global Error Handler for CORS or parsing anomalies
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }
  
  console.error('Unhandled Server Exception:', err);
  return res.status(500).json({
    success: false,
    error: 'An unexpected exception occurred on the backend.'
  });
});

// Start Express Listener
app.listen(config.port, () => {
  console.log('===================================================');
  console.log(`Claude AI Server successfully started on port ${config.port}`);
  console.log(`Health monitoring active at: http://localhost:${config.port}/health`);
  console.log(`Chat endpoint configured at: http://localhost:${config.port}/api/chat`);
  console.log('Allowed Origins:', config.allowedOrigins.join(', '));
  console.log('===================================================');
});
