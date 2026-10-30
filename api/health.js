import { withErrors } from '../server/lib/http.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  const aiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  res.status(200).json({
    ok: true,
    ai: {
      mode: aiKey ? 'live' : 'demo',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    },
    search: {
      mode: tavilyKey ? 'tavily' : 'unavailable',
    },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

