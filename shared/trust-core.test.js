import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDateString, normalizeOcrNoise } from './dateParse.js';
import { calculateExpiryFromMfg, calculatePaoDiscardDate, addMonths, addDays, getExpiryState } from './dateMath.js';
import { parseLabelRule } from './labelRules.js';
import { validateBarcodeChecksum, reconcileAiAndOcrDates } from './agreement.js';
import { assess } from './assess.js';
import { PRIMARY_STATUS, PROVENANCE, EXACT_UNKNOWN_MESSAGE, CATEGORIES } from './constants.js';

test('dateParse: normalizes OCR noise', () => {
  assert.equal(normalizeOcrNoise('EXP 1O/O5/2O26'), '10/05/2026');
  assert.equal(normalizeOcrNoise('B/B JUN 2O26'), 'JUN/2026');
});

test('dateParse: parses supported formats', () => {
  // DD/MM/YYYY
  const d1 = parseDateString('25/08/2026');
  assert.equal(d1?.iso, '2026-08-25');
  assert.equal(d1?.precision, 'day');

  // DD-MM-YY
  const d2 = parseDateString('25-08-26');
  assert.equal(d2?.iso, '2026-08-25');

  // DD.MM.YYYY
  const d3 = parseDateString('25.08.2026');
  assert.equal(d3?.iso, '2026-08-25');

  // MM/YYYY (EXP defaults to end of month)
  const d4 = parseDateString('06/2026', { isMfg: false });
  assert.equal(d4?.iso, '2026-06-30');
  assert.equal(d4?.precision, 'month');

  // MM/YYYY (MFG defaults to first of month)
  const d5 = parseDateString('06/2026', { isMfg: true });
  assert.equal(d5?.iso, '2026-06-01');
  assert.equal(d5?.precision, 'month');

  // Compacted 12JUN26
  const d6 = parseDateString('12JUN26');
  assert.equal(d6?.iso, '2026-06-12');

  // Compacted with noise 12JUN2O26
  const d7 = parseDateString('12JUN2O26');
  assert.equal(d7?.iso, '2026-06-12');

  // Word month: JUN 2026
  const d8 = parseDateString('JUN 2026');
  assert.equal(d8?.iso, '2026-06-30');

  // YYYY-MM-DD
  const d9 = parseDateString('2026-11-15');
  assert.equal(d9?.iso, '2026-11-15');
});

test('dateParse: flags ambiguous dates (day and month both <= 12 and distinct)', () => {
  const d = parseDateString('03/04/2026', { defaultOrder: 'DMY' });
  assert.equal(d?.ambiguous, true);
  assert.equal(d?.candidatesIfAmbiguous?.length, 2);
  assert.equal(d?.candidatesIfAmbiguous[0].order, 'DMY');
  assert.equal(d?.candidatesIfAmbiguous[0].iso, '2026-04-03');
  assert.equal(d?.candidatesIfAmbiguous[1].order, 'MDY');
  assert.equal(d?.candidatesIfAmbiguous[1].iso, '2026-03-04');
});

test('dateParse: rejects implausible years', () => {
  // Beyond 15 years
  const dTooFar = parseDateString('15/05/2050', { referenceYear: 2026 });
  assert.equal(dTooFar, null);

  // Before 2015
  const dTooOld = parseDateString('15/05/2010', { isMfg: true, referenceYear: 2026 });
  assert.equal(dTooOld, null);
});

test('dateMath: addMonths clamps leap years and month ends', () => {
  // 31 Jan + 1 month = 28 Feb (non-leap)
  assert.equal(addMonths('2025-01-31', 1), '2025-02-28');
  // 31 Jan 2024 + 1 month = 29 Feb 2024 (leap year)
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
});

test('dateMath: calculateExpiryFromMfg applies MFG + N months - 1 day convention', () => {
  const calc = calculateExpiryFromMfg('2026-03-12', 24, 'months');
  assert.equal(calc?.iso, '2028-03-11');
  assert.equal(calc?.formulaText, 'MFG 12/03/2026 + 24 months - 1 day = 11/03/2028');

  // Days rule has no minus 1 day
  const calcDays = calculateExpiryFromMfg('2026-03-12', 30, 'days');
  assert.equal(calcDays?.iso, '2026-04-11');
});

test('labelRules: parses relative label statements', () => {
  const r1 = parseLabelRule('Best before 9 months from the date of manufacture');
  assert.equal(r1?.base, 'manufacture');
  assert.equal(r1?.amount, 9);
  assert.equal(r1?.unit, 'months');

  const r2 = parseLabelRule('Use within 12M of MFG');
  assert.equal(r2?.base, 'manufacture');
  assert.equal(r2?.amount, 12);
  assert.equal(r2?.unit, 'months');

  const r3 = parseLabelRule('Consume within 3 days of opening');
  assert.equal(r3?.base, 'opening');
  assert.equal(r3?.amount, 3);
  assert.equal(r3?.unit, 'days');
});

test('agreement: barcode checksums', () => {
  // Valid EAN-13
  assert.equal(validateBarcodeChecksum('8901030383786'), true);
  // Invalid EAN-13
  assert.equal(validateBarcodeChecksum('8901030383787'), false);
  // Non-numeric
  assert.equal(validateBarcodeChecksum('ABC8901030383786'), false);
});

test('agreement: reconcileAiAndOcrDates', () => {
  const ai = [{ kind: 'EXP', parsed: { iso: '2026-05-10' }, rawText: '10/05/2026' }];
  const ocr = [{ kind: 'EXP', parsed: { iso: '2026-05-10' }, rawText: '10/05/2026' }];
  const result = reconcileAiAndOcrDates(ai, ocr);
  assert.equal(result[0].agreement, 'both');

  const aiConflict = [{ kind: 'EXP', parsed: { iso: '2026-05-10' }, rawText: '10/05/2026' }];
  const ocrConflict = [{ kind: 'EXP', parsed: { iso: '2026-06-15' }, rawText: '15/06/2026' }];
  const resultConflict = reconcileAiAndOcrDates(aiConflict, ocrConflict);
  assert.equal(resultConflict[0].agreement, 'conflict');
});

test('assess: no expiry data returns UNKNOWN with exact message', () => {
  const res = assess({
    extraction: { product: { category: 'food' }, dates: [] },
    investigation: { ran: true, conclusion: { type: 'NONE' } },
  });
  assert.equal(res.primaryStatus, PRIMARY_STATUS.EXPIRY_NOT_FOUND);
  assert.equal(res.expiry.provenance, PROVENANCE.UNKNOWN);
  assert.equal(res.expiry.iso, null);
  assert.equal(res.unknownMessage, EXACT_UNKNOWN_MESSAGE);
});

test('assess: ambiguous printed date requires verification', () => {
  const res = assess({
    extraction: {
      product: { category: 'food' },
      dates: [
        {
          kind: 'EXP',
          rawText: '03/04/2026',
          parsed: { iso: '2026-04-03', ambiguous: true, candidatesIfAmbiguous: [] },
          agreement: 'both',
          confirmedByUser: false,
        },
      ],
    },
  });
  assert.equal(res.primaryStatus, PRIMARY_STATUS.VERIFICATION_REQUIRED);
});

test('assess: confirmed printed date yields EXPIRY_VERIFIED', () => {
  const res = assess({
    extraction: {
      product: { category: 'food' },
      dates: [
        {
          kind: 'EXP',
          rawText: '25/08/2026',
          parsed: { iso: '2026-08-25', ambiguous: false },
          agreement: 'both',
          confirmedByUser: true,
        },
      ],
    },
  });
  assert.equal(res.primaryStatus, PRIMARY_STATUS.EXPIRY_VERIFIED);
  assert.equal(res.expiry.provenance, PROVENANCE.PRINTED);
  assert.equal(res.expiry.iso, '2026-08-25');
});

test('assess: label rule + confirmed MFG yields LABEL_RULE with formula', () => {
  const res = assess({
    extraction: {
      product: { category: 'food' },
      labelRules: [{ base: 'manufacture', amount: 6, unit: 'months', rawText: 'Best before 6 months from manufacture' }],
      dates: [
        {
          kind: 'MFG',
          rawText: '10/01/2026',
          parsed: { iso: '2026-01-10', precision: 'day', ambiguous: false },
          agreement: 'both',
          confirmedByUser: true,
        },
      ],
    },
  });
  assert.equal(res.primaryStatus, PRIMARY_STATUS.EXPIRY_VERIFIED);
  assert.equal(res.expiry.provenance, PROVENANCE.LABEL_RULE);
  assert.equal(res.expiry.iso, '2026-07-09');
});

test('assess: severe damage forces DAMAGE_SUSPECTED', () => {
  const res = assess({
    extraction: {
      product: { category: 'food' },
      dates: [
        {
          kind: 'EXP',
          rawText: '25/08/2026',
          parsed: { iso: '2026-08-25', ambiguous: false },
          agreement: 'both',
          confirmedByUser: true,
        },
      ],
      damage: {
        findings: [{ type: 'swollen_container', severity: 'severe', evidence: 'Bulging can dome' }],
      },
    },
  });
  assert.equal(res.primaryStatus, PRIMARY_STATUS.DAMAGE_SUSPECTED);
});

test('assess: PAO calculation computes discard date correctly', () => {
  const res = assess({
    extraction: {
      product: { category: 'cosmetic' },
      pao: { present: true, months: 12 },
      dates: [
        {
          kind: 'EXP',
          rawText: '30/12/2027',
          parsed: { iso: '2027-12-30', ambiguous: false },
          agreement: 'both',
          confirmedByUser: true,
        },
      ],
    },
    userOverrides: {
      openedOn: '2026-05-15',
    },
  });
  assert.equal(res.paoDiscardBy, '2027-05-14');
  assert.equal(res.effectiveDiscardBy, '2027-05-14'); // Earlier than 2027-12-30
});

test('assess: medicine with unreadable expiry refuses to estimate without regulator/mfg', () => {
  const res = assess({
    extraction: {
      product: { category: 'medicine' },
      dates: [],
    },
    investigation: {
      ran: true,
      conclusion: {
        type: 'SHELF_LIFE',
        amount: 24,
        unit: 'months',
        sourceId: 's1',
      },
      sources: [{ id: 's1', class: 'RETAILER', eligible: false }],
    },
  });
  assert.equal(res.primaryStatus, PRIMARY_STATUS.EXPIRY_NOT_FOUND);
  assert.equal(res.expiry.provenance, PROVENANCE.UNKNOWN);
  assert.equal(res.unknownMessage, EXACT_UNKNOWN_MESSAGE);
});
