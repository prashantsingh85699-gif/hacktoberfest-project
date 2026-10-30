/**
 * Extracts relative shelf-life or usage rules printed on packaging
 */
export function parseLabelRule(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();

  // Determine base
  let base = null;
  if (/manufactur|mfg|mfd|prod/i.test(text)) {
    base = 'manufacture';
  } else if (/pack(ing|ed)?|pkd/i.test(text)) {
    base = 'packing';
  } else if (/open(ing|ed)?/i.test(text)) {
    base = 'opening';
  }

  // Look for patterns like:
  // "9 months", "12M", "24 months", "3 days", "2 years"
  // preceded or followed by "best before", "use within", "expires", "valid for", "consume within"
  const amountUnitRegex = /(\d{1,3})\s*(months?|mths?|mos?|m|years?|yrs?|y|days?|d)\b/i;
  const match = text.match(amountUnitRegex);

  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const rawUnit = match[2].toLowerCase();

  let unit = null;
  if (rawUnit.startsWith('d')) {
    unit = 'days';
  } else if (rawUnit.startsWith('m')) {
    unit = 'months';
  } else if (rawUnit.startsWith('y')) {
    unit = 'years';
  }

  // If no base explicitly mentioned but rule has "best before X months from ..."
  if (!base) {
    if (/from\s+(the\s+)?date\s+of\s+(mfg|manufacture)/i.test(text)) {
      base = 'manufacture';
    } else if (/from\s+(the\s+)?date\s+of\s+pack/i.test(text)) {
      base = 'packing';
    } else {
      // Default to manufacture if typical "best before X months" on standard food/cosmetics
      base = 'manufacture';
    }
  }

  if (amount > 0 && unit && base) {
    return {
      rawText: text,
      base,
      amount,
      unit,
    };
  }

  return null;
}

