import express from 'express';
import healthHandler from '../api/health.js';
import scanHandler from '../api/scan.js';
import investigateHandler from '../api/investigate.js';

const app = express();
const port = process.env.PORT || 8787;

// Request body limits matching Vercel payload constraints
app.use(express.json({ limit: '3mb' }));

// Adapt Vercel serverless function to Express middleware
function adaptHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

app.get('/api/health', adaptHandler(healthHandler));
app.post('/api/scan', adaptHandler(scanHandler));
app.post('/api/investigate', adaptHandler(investigateHandler));

app.listen(port, () => {
  console.log(`[ExpiryWatch AI Dev Server] Listening on http://localhost:${port}`);
  console.log(`[ExpiryWatch AI Dev Server] AI Mode: ${process.env.GEMINI_API_KEY ? 'LIVE (Gemini)' : 'DEMO (Canned Data)'}`);
  console.log(`[ExpiryWatch AI Dev Server] Search Mode: ${process.env.TAVILY_API_KEY ? 'LIVE (Tavily)' : 'UNAVAILABLE / DEMO'}`);
});
