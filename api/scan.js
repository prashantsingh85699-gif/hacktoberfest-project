import { withErrors, HttpError } from '../server/lib/http.js';
import { checkRateLimit } from '../server/lib/rateLimit.js';
import { validateScanInput, normalizeExtraction } from '../server/lib/validate.js';
import { extractWithGemini } from '../server/lib/gemini.js';
import { getDemoScanFixture } from '../server/lib/demoFixtures.js';
import { reconcileAiAndOcrDates, extractDateCandidatesFromOcr } from '../shared/agreement.js';
import { assess } from '../shared/assess.js';
import { lookupBarcodeIdentity } from '../server/lib/offLookup.js';

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

  // Automatic barcode identity corroboration
  const foundBarcode =
    extraction.barcodes?.[0]?.value ||
    validatedInput.barcodes?.[0]?.value ||
    extractionRaw?.barcode ||
    allOcrCandidates.find((c) => /^\d{8,14}$/.test(c)) ||
    null;

  if (foundBarcode) {
    if (!extraction.barcodes || extraction.barcodes.length === 0) {
      extraction.barcodes = [{ format: 'EAN_13', value: foundBarcode }];
    }
    try {
      const barcodeData = await lookupBarcodeIdentity(foundBarcode, extraction.product?.category);
      if (barcodeData && barcodeData.found) {
        if (!extraction.product.name || extraction.product.name === 'Unknown Product') {
          extraction.product.name = barcodeData.name || extraction.product.name;
        }
        if (!extraction.product.brand) {
          extraction.product.brand = barcodeData.brand || extraction.product.brand;
        }
        if (extraction.product.category === 'other' || !extraction.product.category) {
          extraction.product.category = 'food';
        }
        extraction.product.identityConfidence = Math.max(0.85, extraction.product.identityConfidence || 0.5);
      }
    } catch {
      // Barcode lookup is optional network enrichment
    }
  }

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

