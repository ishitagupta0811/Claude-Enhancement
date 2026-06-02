const dotenv = require('dotenv');
const path = require('path');

// Resolve path to the .env file situated in the /server directory root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  anthropicApiKey: process.env.GROQ_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  // Allowed CORS origins - default configuration matches typical Vite dev server ports
  allowedOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ]
};
