import { withErrors, HttpError } from '../server/lib/http.js';
import { checkRateLimit } from '../server/lib/rateLimit.js';
import { lookupBarcodeIdentity } from '../server/lib/offLookup.js';
import { executeTavilySearch } from '../server/lib/search.js';
import { classifySource } from '../server/lib/sourceClassifier.js';
import { extractEvidenceWithGemini } from '../server/lib/gemini.js';
import { verifyClaim, deriveConclusion } from '../server/lib/evidence.js';
import { getDemoInvestigationFixture } from '../server/lib/demoFixtures.js';

// 24-hour in-memory investigation cache
const investigationCache = new Map();

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp, 'investigate', 4)) {
    throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Investigation limit exceeded (4 per minute). Please wait a moment.');
  }

  const body = req.body || {};
  const identity = body.identity || {};
  const barcode = body.barcode || null;
  const batchNumber = body.batchNumber || null;

  // 1. Identity gate
  const brand = (identity.brand || '').trim();
  const name = (identity.name || '').trim();
  const confidence = typeof identity.identityConfidence === 'number' ? identity.identityConfidence : 0.5;

  if (!brand || !name || confidence < 0.6) {
    return res.status(200).json({
      investigation: {
        ran: false,
        status: 'SKIPPED_IDENTITY_UNCLEAR',
        reason: 'Brand or product name could not be reliably identified with high confidence (>= 0.6). Please add a clearer front photo.',
        queries: [],
        identityLookup: null,
        sources: [],
        claims: [],
        conclusion: { type: 'NONE', sourceId: null, quote: null },
        creditsUsed: 0,
        isDemo: false,
      },
    });
  }

  const cacheKey = `${identity.category || 'food'}|${brand}|${name}|${identity.variant || ''}|${identity.strength || ''}`.toLowerCase();
  if (investigationCache.has(cacheKey)) {
    return res.status(200).json({
      investigation: investigationCache.get(cacheKey),
    });
  }

  // Demo mode check
  if (!process.env.GEMINI_API_KEY && !process.env.TAVILY_API_KEY) {
    const demo = getDemoInvestigationFixture(identity);
    investigationCache.set(cacheKey, demo);
    return res.status(200).json({
      investigation: demo,
    });
  }

  // 2. Barcode lookup
  const identityLookup = barcode ? await lookupBarcodeIdentity(barcode, identity.category) : null;

  // 3. Search queries
  const queries = [];
  let sources = [];
  let totalCredits = 0;

  let q1 = '';
  if (identity.category === 'medicine') {
    q1 = `"${brand}" "${name}" ${identity.strength || ''} ${identity.dosageForm || ''} prescribing information shelf life storage`.trim();
  } else {
    q1 = `"${brand}" "${name}" ${identity.variant || ''} shelf life unopened`.trim();
  }
  queries.push(q1);

  const search1 = await executeTavilySearch({ query: q1, depth: 'advanced', maxResults: 8 });
  totalCredits += search1.creditsUsed;

  if (search1.error === 'SEARCH_UNAVAILABLE') {
    return res.status(200).json({
      investigation: {
        ran: true,
        status: 'SEARCH_UNAVAILABLE',
        reason: 'Manufacturer web search is not configured on this server (TAVILY_API_KEY missing).',
        queries,
        identityLookup,
        sources: [],
        claims: [],
        conclusion: { type: 'NONE', sourceId: null, quote: null },
        creditsUsed: 0,
        isDemo: false,
      },
    });
  }

  let rawResults = search1.results || [];

  // Classify sources
  sources = rawResults.map((r, i) => {
    const classification = classifySource(r.url, {
      brand,
      manufacturer: identity.manufacturer,
      category: identity.category,
    });
    return {
      id: `s${i + 1}`,
      url: r.url,
      title: r.title,
      text: r.content,
      domain: classification.domain,
      class: classification.class,
      eligible: classification.eligible,
      reason: classification.reason,
    };
  });

  const eligibleSources = sources.filter((s) => s.eligible);

  // If Q1 yielded no eligible sources, try Q2
  if (eligibleSources.length === 0) {
    const mfgOrBrand = identity.manufacturer || brand;
    const q2 = `"${mfgOrBrand}" "${name}" expiry date batch number how to read`.trim();
    queries.push(q2);
    const search2 = await executeTavilySearch({ query: q2, depth: 'basic', maxResults: 6 });
    totalCredits += search2.creditsUsed;

    if (search2.results) {
      for (const r of search2.results) {
        const classification = classifySource(r.url, {
          brand,
          manufacturer: identity.manufacturer,
          category: identity.category,
        });
        sources.push({
          id: `s${sources.length + 1}`,
          url: r.url,
          title: r.title,
          text: r.content,
          domain: classification.domain,
          class: classification.class,
          eligible: classification.eligible,
          reason: classification.reason,
        });
      }
    }
  }

  // 4. Evidence Extraction with Gemini
  const sourcesForExtraction = sources.filter((s) => s.eligible).slice(0, 5);
  let extractedClaims = [];

  if (sourcesForExtraction.length > 0) {
    const aiEvidence = await extractEvidenceWithGemini(identity, sourcesForExtraction);
    if (aiEvidence && Array.isArray(aiEvidence.claims)) {
      extractedClaims = aiEvidence.claims;
    }
  }

  // 5. Server-side claim verification (Anti-hallucination gate)
  const verifiedClaims = [];
  for (const rawClaim of extractedClaims) {
    const src = sources.find((s) => s.id === rawClaim.sourceId);
    const verification = verifyClaim({
      claim: rawClaim,
      source: src,
      identity,
      batchNumber,
    });

    verifiedClaims.push({
      sourceId: rawClaim.sourceId,
      type: rawClaim.type || 'shelf_life',
      quote: rawClaim.quote || '',
      accepted: verification.accepted,
      rejectReason: verification.rejectReason,
      parsedValue: verification.parsedValue,
    });
  }

  // 6. Conclusion
  const conclusion = deriveConclusion(verifiedClaims);

  const cleanSources = sources.map(({ text, ...s }) => s); // Omit raw text from client response

  let status = 'DONE';
  if (conclusion.type === 'CONFLICT') {
    status = 'CONFLICT';
  } else if (conclusion.type === 'NONE') {
    status = verifiedClaims.length === 0 ? 'NO_EVIDENCE' : 'DONE';
  }

  const investigation = {
    ran: true,
    status,
    queries,
    identityLookup,
    sources: cleanSources,
    claims: verifiedClaims,
    conclusion,
    creditsUsed: totalCredits,
    isDemo: false,
  };

  investigationCache.set(cacheKey, investigation);

  return res.status(200).json({ investigation });
});

