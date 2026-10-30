import { daysInMonth, pad2 } from './dateParse.js';

export function parseUtcIso(isoString) {
  if (!isoString || typeof isoString !== 'string') return null;
  const parts = isoString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export function formatUtcIso(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatDisplayDate(isoString) {
  const d = parseUtcIso(isoString);
  if (!d) return isoString || '';
  return `${pad2(d.day)}/${pad2(d.month)}/${d.year}`;
}

export function addDays(isoString, days) {
  const d = parseUtcIso(isoString);
  if (!d) return null;
  const date = new Date(Date.UTC(d.year, d.month - 1, d.day));
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Adds months to a UTC date, clamping to end of target month if overflow
 * e.g. Jan 31 + 1 month = Feb 28 (or 29)
 */
export function addMonths(isoString, monthsToAdd) {
  const d = parseUtcIso(isoString);
  if (!d) return null;

  const totalMonths = (d.year * 12 + (d.month - 1)) + monthsToAdd;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  const maxDay = daysInMonth(newYear, newMonth);
  const newDay = Math.min(d.day, maxDay);

  return formatUtcIso(newYear, newMonth, newDay);
}

export function addYears(isoString, yearsToAdd) {
  return addMonths(isoString, yearsToAdd * 12);
}

/**
 * Calculates expiry date based on manufacturing date and rule/shelf-life.
 * Standard rule convention: MFG + N months/years - 1 day.
 * Days rule: MFG + N days (no minus 1 day).
 * 
 * Returns: { iso, formulaText, disclaimer }
 */
export function calculateExpiryFromMfg(mfgIso, amount, unit, precision = 'day') {
  if (!mfgIso || !amount || !unit) return null;
  const normUnit = unit.toLowerCase();
  const mfgDisplay = formatDisplayDate(mfgIso);

  let targetIso;
  let formulaText;

  if (normUnit.startsWith('day')) {
    targetIso = addDays(mfgIso, amount);
    formulaText = `MFG ${mfgDisplay} + ${amount} days = ${formatDisplayDate(targetIso)}`;
  } else if (normUnit.startsWith('month') || normUnit.startsWith('mth') || normUnit === 'm') {
    const afterMonths = addMonths(mfgIso, amount);
    targetIso = addDays(afterMonths, -1);
    formulaText = `MFG ${mfgDisplay} + ${amount} months - 1 day = ${formatDisplayDate(targetIso)}`;
  } else if (normUnit.startsWith('year') || normUnit.startsWith('yr') || normUnit === 'y') {
    const afterYears = addYears(mfgIso, amount);
    targetIso = addDays(afterYears, -1);
    formulaText = `MFG ${mfgDisplay} + ${amount} years - 1 day = ${formatDisplayDate(targetIso)}`;
  } else {
    return null;
  }

  return {
    iso: targetIso,
    formulaText,
    disclaimer: 'Calculated, not printed. Conventions differ between manufacturers; verify with the manufacturer.',
  };
}

/**
 * Calculates cosmetic PAO discard-by date from opened date
 * e.g. openedOn 2026-03-15 + 12M -> 2027-03-14
 */
export function calculatePaoDiscardDate(openedIso, paoMonths) {
  if (!openedIso || !paoMonths) return null;
  const afterMonths = addMonths(openedIso, paoMonths);
  const discardIso = addDays(afterMonths, -1);
  return {
    iso: discardIso,
    formulaText: `Opened ${formatDisplayDate(openedIso)} + ${paoMonths}M PAO - 1 day = ${formatDisplayDate(discardIso)}`,
  };
}

/**
 * Returns earlier of two ISO dates
 */
export function getEarlierDate(isoA, isoB) {
  if (!isoA && !isoB) return null;
  if (!isoA) return isoB;
  if (!isoB) return isoA;
  return isoA <= isoB ? isoA : isoB;
}

/**
 * Compares date with reference date (default today UTC)
 * Returns 'expired' | 'expiring_soon' | 'in_date'
 */
export function getExpiryState(expiryIso, referenceIso = null) {
  if (!expiryIso) return 'unknown';
  const today = referenceIso || new Date().toISOString().slice(0, 10);
  if (expiryIso < today) {
    return 'expired';
  }
  const in30Days = addDays(today, 30);
  if (expiryIso <= in30Days) {
    return 'expiring_soon';
  }
  return 'in_date';
}

