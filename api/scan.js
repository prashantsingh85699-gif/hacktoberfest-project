import { withErrors, HttpError } from '../server/lib/http.js';
import { checkRateLimit } from '../server/lib/rateLimit.js';
import { validateScanInput, normalizeExtraction } from '../server/lib/validate.js';
import { extractWithGemini } from '../server/lib/gemini.js';
import { getDemoScanFixture } from '../server/lib/demoFixtures.js';
import { reconcileAiAndOcrDates, extractDateCandidatesFromOcr } from '../shared/agreement.js';
import { assess } from '../shared/assess.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp, 'scan', 8)) {
    throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Scan request limit exceeded (8 per minute). Please wait a moment.');
  }

  const validatedInput = validateScanInput(req.body);

  // Combine OCR candidates from all images
  const allOcrCandidates = [];
  for (const ocrItem of validatedInput.ocr) {
    const candidates = extractDateCandidatesFromOcr(ocrItem.text);
    allOcrCandidates.push(...candidates);
  }

  let extractionRaw = null;
  let meta = { source: 'demo', model: null };

  const geminiResult = await extractWithGemini(validatedInput);
  if (geminiResult && geminiResult.data) {
    extractionRaw = geminiResult.data;
    meta = { source: 'gemini', model: geminiResult.model };
  } else {
    // Demo fallback
    extractionRaw = getDemoScanFixture(validatedInput.hints);
    meta = { source: 'demo', model: 'demo-canned-data' };
  }

  // Normalize and parse dates deterministically
  const extraction = normalizeExtraction(extractionRaw, validatedInput);

  // Reconcile dates between AI and OCR
  extraction.dates = reconcileAiAndOcrDates(extraction.dates, allOcrCandidates);

  // Compute assessment
  const assessment = assess({
    extraction,
    investigation: null,
    userOverrides: {},
  });

  return res.status(200).json({
    extraction,
    assessment,
    meta,
  });
});
