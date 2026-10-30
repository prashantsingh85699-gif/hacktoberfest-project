import { parseDateString } from '../../shared/dateParse.js';

function normalizeTextForSubstring(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const GENERIC_PRODUCT_TOKENS = new Set([
  'the', 'and', 'with', 'for', 'skin', 'care', 'product', 'capsule', 'tablet', 'cream',
  'food', 'pack', 'bottle', 'organic', 'natural', 'pure', 'classic', 'original',
]);

function extractSignificantTokens(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !GENERIC_PRODUCT_TOKENS.has(t));
}

/**
 * Server-side anti-hallucination verification
 */
export function verifyClaim({ claim, source, identity, batchNumber = null }) {
  if (!claim || !claim.quote || !source || !source.text) {
    return {
      accepted: false,
      rejectReason: 'Missing quote or source text.',
      parsedValue: null,
    };
  }

  // (a) Substring check: normalized quote MUST be substring of fetched source text
  const normQuote = normalizeTextForSubstring(claim.quote);
  const normSource = normalizeTextForSubstring(source.text);

  if (!normSource.includes(normQuote)) {
    return {
      accepted: false,
      rejectReason: 'Anti-hallucination check failed: Quote is not a verbatim substring of source text.',
      parsedValue: null,
    };
  }

  // (d) Source eligibility check
  if (!source.eligible) {
    return {
      accepted: false,
      rejectReason: `Source ${source.domain} (${source.class}) is not eligible to establish shelf life.`,
      parsedValue: null,
    };
  }

  // (c) Product name match: at least 60% of significant tokens in quote + title + url
  const combinedContext = `${source.title || ''} ${source.url || ''} ${claim.quote}`.toLowerCase();
  const nameTokens = extractSignificantTokens(identity.name);
  if (nameTokens.length > 0) {
    const matchedCount = nameTokens.filter((t) => combinedContext.includes(t)).length;
    const ratio = matchedCount / nameTokens.length;
    if (ratio < 0.6) {
      return {
        accepted: false,
        rejectReason: `Product name match insufficient (${(ratio * 100).toFixed(0)}% < 60%). Claim may belong to a different variant.`,
        parsedValue: null,
      };
    }
  }

  // For medicines, strength token must be present if known
  if (identity.category === 'medicine' && identity.strength) {
    const cleanStrength = identity.strength.toLowerCase().replace(/\s+/g, '');
    const contextNoSpace = combinedContext.replace(/\s+/g, '');
    if (!contextNoSpace.includes(cleanStrength)) {
      return {
        accepted: false,
        rejectReason: `Medicine strength (${identity.strength}) not found in source context. Cannot apply to different strength formulation.`,
        parsedValue: null,
      };
    }
  }

  // (b) Server's own regex on quote
  const shelfLifeKeywordRegex = /(shelf\s*life|expir|best\s*before|use\s*by|use\s*within|valid\s*for|stable\s*for)/i;
  if (!shelfLifeKeywordRegex.test(claim.quote)) {
    return {
      accepted: false,
      rejectReason: 'Quote does not contain an accepted shelf-life or expiry keyword.',
      parsedValue: null,
    };
  }

  const amountUnitRegex = /(\d{1,3})\s*(months?|mths?|mos?|years?|yrs?|days?)/i;
  const match = claim.quote.match(amountUnitRegex);
  if (!match) {
    return {
      accepted: false,
      rejectReason: 'No valid numeric shelf-life duration found in quote.',
      parsedValue: null,
    };
  }

  const amount = parseInt(match[1], 10);
  const rawUnit = match[2].toLowerCase();
  let unit = 'months';
  if (rawUnit.startsWith('day')) unit = 'days';
  if (rawUnit.startsWith('year') || rawUnit.startsWith('yr')) unit = 'years';

  // Batch specific claim check
  if (claim.type === 'batch_expiry') {
    if (!batchNumber || !claim.quote.includes(batchNumber)) {
      return {
        accepted: false,
        rejectReason: 'Batch-specific claim did not contain verbatim batch number in quote.',
        parsedValue: null,
      };
    }
    const parsedDate = parseDateString(claim.quote);
    if (!parsedDate || !parsedDate.iso) {
      return {
        accepted: false,
        rejectReason: 'Batch claim lacked a parseable full expiration date.',
        parsedValue: null,
      };
    }
    return {
      accepted: true,
      rejectReason: null,
      parsedValue: { type: 'BATCH_EXPIRY', iso: parsedDate.iso, precision: parsedDate.precision },
    };
  }

  return {
    accepted: true,
    rejectReason: null,
    parsedValue: { type: 'SHELF_LIFE', amount, unit },
  };
}

/**
 * Derives conclusion from verified claims
 */
export function deriveConclusion(verifiedClaims = []) {
  const accepted = verifiedClaims.filter((c) => c.accepted && c.parsedValue);

  if (accepted.length === 0) {
    return {
      type: 'NONE',
      sourceId: null,
      quote: null,
    };
  }

  const batchClaim = accepted.find((c) => c.parsedValue.type === 'BATCH_EXPIRY');
  if (batchClaim) {
    return {
      type: 'BATCH_EXPIRY',
      iso: batchClaim.parsedValue.iso,
      precision: batchClaim.parsedValue.precision,
      sourceId: batchClaim.sourceId,
      quote: batchClaim.quote,
    };
  }

  const shelfLifeClaims = accepted.filter((c) => c.parsedValue.type === 'SHELF_LIFE');
  if (shelfLifeClaims.length === 0) {
    return { type: 'NONE', sourceId: null, quote: null };
  }

  // Normalize all to months for comparison
  const normalizedMonths = shelfLifeClaims.map((c) => {
    let months = c.parsedValue.amount;
    if (c.parsedValue.unit === 'years') months = months * 12;
    if (c.parsedValue.unit === 'days') months = months / 30;
    return { claim: c, months };
  });

  const firstMonths = normalizedMonths[0].months;
  const hasConflict = normalizedMonths.some((n) => Math.abs(n.months - firstMonths) > 0.1);

  if (hasConflict) {
    return {
      type: 'CONFLICT',
      claims: shelfLifeClaims.map((c) => ({
        sourceId: c.sourceId,
        quote: c.quote,
        amount: c.parsedValue.amount,
        unit: c.parsedValue.unit,
      })),
      sourceId: null,
      quote: null,
    };
  }

  // All agreed
  const top = shelfLifeClaims[0];
  return {
    type: 'SHELF_LIFE',
    amount: top.parsedValue.amount,
    unit: top.parsedValue.unit,
    sourceId: top.sourceId,
    quote: top.quote,
  };
}
