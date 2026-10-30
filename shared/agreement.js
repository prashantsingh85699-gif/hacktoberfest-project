import { parseDateString } from './dateParse.js';

/**
 * Validates standard barcode checksums (EAN-13, EAN-8, UPC-A, UPC-E)
 */
export function validateBarcodeChecksum(barcode) {
  if (!barcode || typeof barcode !== 'string') return false;
  const digits = barcode.trim();
  if (!/^\d{8,14}$/.test(digits)) return false;

  // EAN-13, EAN-8, UPC-A (12 digits), ITF-14
  const len = digits.length;
  if (![8, 12, 13, 14].includes(len)) return false;

  const numArr = digits.split('').map(Number);
  const checkDigit = numArr[len - 1];

  let sum = 0;
  // Standard modulo-10 algorithm with alternating weights 3 and 1 from right to left
  let weight = 3;
  for (let i = len - 2; i >= 0; i--) {
    sum += numArr[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Scans raw OCR text for date candidates
 */
export function extractDateCandidatesFromOcr(ocrText, options = {}) {
  if (!ocrText || typeof ocrText !== 'string') return [];
  const lines = ocrText.split(/\r?\n/);
  const results = [];

  // Patterns for finding date-like substrings
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[a-zA-Z]{3,}\s+\d{2,4}|\d{1,2}[a-zA-Z]{3,}\d{2,4}|[a-zA-Z]{3,}[\/\-\s]+\d{2,4}|\d{1,2}[\/\-\.]\d{2,4})\b/g;

  for (const line of lines) {
    let match;
    while ((match = dateRegex.exec(line)) !== null) {
      const candidateStr = match[0];
      const lineLower = line.toLowerCase();
      let kind = 'OTHER';
      if (/exp|use\s*by|best\s*before|b\/b|bb\b/i.test(lineLower)) {
        kind = 'EXP';
      } else if (/mfg|mfd|m\.f\.g|pkd|packed|dom\b/i.test(lineLower)) {
        kind = 'MFG';
      }

      const parsed = parseDateString(candidateStr, {
        isMfg: kind === 'MFG',
        defaultOrder: options.defaultOrder || 'DMY',
      });

      if (parsed) {
        results.push({
          rawText: candidateStr,
          kind,
          parsed,
        });
      }
    }
  }

  return results;
}

/**
 * Reconciles AI dates with OCR candidates
 * Returns array of dates with `agreement: 'both' | 'single_ai' | 'single_ocr' | 'conflict'`
 */
export function reconcileAiAndOcrDates(aiDates = [], ocrDates = []) {
  const reconciled = [];
  const matchedOcrIndices = new Set();

  for (const aiDate of aiDates) {
    if (!aiDate.parsed) {
      reconciled.push({
        ...aiDate,
        agreement: 'single_ai',
        confirmedByUser: false,
      });
      continue;
    }

    // Look for matching OCR date
    let matched = false;
    let conflict = false;

    for (let i = 0; i < ocrDates.length; i++) {
      const ocrCandidate = ocrDates[i];
      if (!ocrCandidate.parsed) continue;

      // Check if same kind or relevant expiry kinds
      const isBothExp = ['EXP', 'BEST_BEFORE', 'USE_BY'].includes(aiDate.kind) &&
                        ['EXP', 'BEST_BEFORE', 'USE_BY'].includes(ocrCandidate.kind);
      const isBothMfg = (aiDate.kind === 'MFG' && ocrCandidate.kind === 'MFG');

      if (isBothExp || isBothMfg) {
        if (aiDate.parsed.iso === ocrCandidate.parsed.iso) {
          matched = true;
          matchedOcrIndices.add(i);
          break;
        } else {
          conflict = true;
        }
      } else if (aiDate.parsed.iso === ocrCandidate.parsed.iso) {
        matched = true;
        matchedOcrIndices.add(i);
        break;
      }
    }

    let agreement = 'single_ai';
    if (matched) {
      agreement = 'both';
    } else if (conflict) {
      agreement = 'conflict';
    }

    reconciled.push({
      ...aiDate,
      agreement,
      confirmedByUser: false,
    });
  }

  // Include OCR dates that weren't detected by AI
  for (let i = 0; i < ocrDates.length; i++) {
    if (!matchedOcrIndices.has(i)) {
      const ocr = ocrDates[i];
      reconciled.push({
        kind: ocr.kind,
        rawText: ocr.rawText,
        modelConfidence: 0.5,
        parsed: ocr.parsed,
        agreement: 'single_ocr',
        confirmedByUser: false,
      });
    }
  }

  return reconciled;
}
