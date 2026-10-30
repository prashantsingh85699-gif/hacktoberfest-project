const MONTH_NAMES = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function matchMonthName(token) {
  if (!token) return null;
  const clean = token.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return null;
  
  if (MONTH_NAMES[clean]) {
    return MONTH_NAMES[clean];
  }

  // Check 3-letter prefix or edit distance <= 1 for 3-letter abbreviations
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (name.length === 3) {
      if (clean.length === 3 && levenshtein(clean, name) <= 1) {
        return num;
      }
    } else {
      if (levenshtein(clean, name) <= 1) {
        return num;
      }
    }
  }
  return null;
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Normalizes OCR noise and standardizes separators
 */
export function normalizeOcrNoise(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  // Strip common label prefixes
  text = text.replace(/^(EXP|EXPIRY|EXP\.?|E\.?|B[\/\.]?B[\/\.]?|BEST\s+BEFORE\s+END|BEST\s+BEFORE|USE\s+BY|UB|MFG|MFD|M[\/\.]?F[\/\.]?G[\/\.]?|M\.?|PKD|DOM|PACKED\s+ON|PROD)[:\s\-\/]*/i, '');
  text = text.trim();

  // Replace separators with '/'
  text = text.replace(/[\.\-,\s]+/g, '/');

  // Fix numeric substitutions if pattern looks like digits with OCR noise (O, I, l, S, B)
  // Example: 1O/O5/2O26 -> 10/05/2026
  const parts = text.split('/');
  const cleanedParts = parts.map(part => {
    // If part contains month name letters like JUN, keep it
    if (/[a-zA-Z]{3,}/.test(part) && matchMonthName(part)) {
      return part;
    }
    // If it looks like numeric with substitutions:
    if (/^[0-9OIlSB]+$/i.test(part)) {
      return part
        .replace(/[Oo]/g, '0')
        .replace(/[Il]/g, '1')
        .replace(/[Ss]/g, '5')
        .replace(/[Bb]/g, '8');
    }
    return part;
  });

  return cleanedParts.join('/');
}

/**
 * Parses date string
 * @param {string} rawText 
 * @param {object} options { isMfg: boolean, defaultOrder: 'DMY'|'MDY', referenceYear?: number }
 */
export function parseDateString(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string') return null;
  const isMfg = !!options.isMfg;
  const defaultOrder = (options.defaultOrder || process.env.DATE_ORDER || 'DMY').toUpperCase();
  const currentYear = options.referenceYear || new Date().getUTCFullYear();

  let text = rawText.trim();
  
  // Also handle compacted forms like 12JUN26 or 12JUN2026
  const compactedMatch = text.match(/^([0-9OIlSB]{1,2})\s*([a-zA-Z]{3,})\s*([0-9OIlSB]{2,4})$/i);
  if (compactedMatch) {
    const rawDay = compactedMatch[1].replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
    const monthNum = matchMonthName(compactedMatch[2]);
    let rawYear = compactedMatch[3].replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
    if (monthNum) {
      let year = parseInt(rawYear, 10);
      if (year < 100) year = 2000 + year;
      const day = parseInt(rawDay, 10);
      const maxDays = daysInMonth(year, monthNum);
      if (day >= 1 && day <= maxDays) {
        const iso = `${year}-${pad2(monthNum)}-${pad2(day)}`;
        return checkPlausibility({
          iso,
          precision: 'day',
          ambiguous: false,
          candidatesIfAmbiguous: [],
          raw: rawText,
        }, isMfg, currentYear);
      }
    }
  }

  // Handle month-year string like JUN 2026 or JUN-26 or 06/2026
  const monthYearWordMatch = text.match(/^([a-zA-Z]{3,})[\/\-\s]+([0-9OIlSB]{2,4})$/i);
  if (monthYearWordMatch) {
    const monthNum = matchMonthName(monthYearWordMatch[1]);
    let rawYear = monthYearWordMatch[2].replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
    if (monthNum) {
      let year = parseInt(rawYear, 10);
      if (year < 100) year = 2000 + year;
      const day = isMfg ? 1 : daysInMonth(year, monthNum);
      const iso = `${year}-${pad2(monthNum)}-${pad2(day)}`;
      return checkPlausibility({
        iso,
        precision: 'month',
        ambiguous: false,
        candidatesIfAmbiguous: [],
        raw: rawText,
      }, isMfg, currentYear);
    }
  }

  const normalized = normalizeOcrNoise(text);
  const segments = normalized.split('/').filter(Boolean);

  // Case 1: Year-Month-Day (ISO-like YYYY/MM/DD)
  if (segments.length === 3 && segments[0].length === 4) {
    const year = parseInt(segments[0], 10);
    const month = parseInt(segments[1], 10);
    const day = parseInt(segments[2], 10);
    if (isValidDate(year, month, day)) {
      return checkPlausibility({
        iso: `${year}-${pad2(month)}-${pad2(day)}`,
        precision: 'day',
        ambiguous: false,
        candidatesIfAmbiguous: [],
        raw: rawText,
      }, isMfg, currentYear);
    }
  }

  // Case 2: Three segments: D/M/Y or M/D/Y or D/MMM/Y
  if (segments.length === 3) {
    let [p1, p2, p3] = segments;

    // Check if middle is month name
    const namedMonth = matchMonthName(p2);
    if (namedMonth) {
      const day = parseInt(p1, 10);
      let year = parseInt(p3, 10);
      if (year < 100) year = 2000 + year;
      if (isValidDate(year, namedMonth, day)) {
        return checkPlausibility({
          iso: `${year}-${pad2(namedMonth)}-${pad2(day)}`,
          precision: 'day',
          ambiguous: false,
          candidatesIfAmbiguous: [],
          raw: rawText,
        }, isMfg, currentYear);
      }
    }

    const n1 = parseInt(p1, 10);
    const n2 = parseInt(p2, 10);
    let year = parseInt(p3, 10);
    if (year < 100) year = 2000 + year;

    // Check ambiguity: both n1 <= 12 and n2 <= 12 and n1 !== n2
    if (n1 >= 1 && n1 <= 12 && n2 >= 1 && n2 <= 12 && n1 !== n2) {
      const dmyIso = `${year}-${pad2(n2)}-${pad2(n1)}`;
      const mdyIso = `${year}-${pad2(n1)}-${pad2(n2)}`;
      const primaryIso = defaultOrder === 'MDY' ? mdyIso : dmyIso;
      return checkPlausibility({
        iso: primaryIso,
        precision: 'day',
        ambiguous: true,
        candidatesIfAmbiguous: [
          { order: 'DMY', iso: dmyIso, label: `${pad2(n1)}/${pad2(n2)}/${year} (Day/Month/Year)` },
          { order: 'MDY', iso: mdyIso, label: `${pad2(n1)}/${pad2(n2)}/${year} (Month/Day/Year)` },
        ],
        raw: rawText,
      }, isMfg, currentYear);
    }

    // Unambiguous DMY or MDY
    let day, month;
    if (n1 > 12 && n2 <= 12) {
      // Must be DMY
      day = n1;
      month = n2;
    } else if (n2 > 12 && n1 <= 12) {
      // Must be MDY
      month = n1;
      day = n2;
    } else if (n1 === n2 && n1 <= 12) {
      // Same (e.g. 05/05/2026) -> not ambiguous
      day = n1;
      month = n2;
    } else {
      return null;
    }

    if (isValidDate(year, month, day)) {
      return checkPlausibility({
        iso: `${year}-${pad2(month)}-${pad2(day)}`,
        precision: 'day',
        ambiguous: false,
        candidatesIfAmbiguous: [],
        raw: rawText,
      }, isMfg, currentYear);
    }
  }

  // Case 3: Two segments: MM/YYYY or MM/YY or YYYY/MM
  if (segments.length === 2) {
    let month, year;
    if (segments[0].length === 4) {
      // YYYY/MM
      year = parseInt(segments[0], 10);
      month = parseInt(segments[1], 10);
    } else {
      // MM/YYYY or MM/YY
      month = parseInt(segments[0], 10);
      year = parseInt(segments[1], 10);
      if (year < 100) year = 2000 + year;
    }

    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const day = isMfg ? 1 : daysInMonth(year, month);
      return checkPlausibility({
        iso: `${year}-${pad2(month)}-${pad2(day)}`,
        precision: 'month',
        ambiguous: false,
        candidatesIfAmbiguous: [],
        raw: rawText,
      }, isMfg, currentYear);
    }
  }

  return null;
}

function isValidDate(year, month, day) {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

function checkPlausibility(parsed, isMfg, currentYear) {
  if (!parsed || !parsed.iso) return null;
  const parts = parsed.iso.split('-').map(Number);
  const year = parts[0];

  // Plausibility rules:
  // MFG between 2015-01-01 and today+1 year
  if (isMfg) {
    if (year < 2015 || year > currentYear + 1) {
      return null;
    }
  } else {
    // EXP not more than 15 years from today, and not before 2015
    if (year < 2015 || year > currentYear + 15) {
      return null;
    }
  }
  return parsed;
}
