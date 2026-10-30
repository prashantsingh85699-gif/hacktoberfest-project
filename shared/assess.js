import {
  PRIMARY_STATUS,
  PROVENANCE,
  EXPIRY_STATE,
  CATEGORIES,
  CRITICAL_DAMAGE_TYPES,
  EXACT_UNKNOWN_MESSAGE,
} from './constants.js';
import { calculateExpiryFromMfg, calculatePaoDiscardDate, getEarlierDate, getExpiryState } from './dateMath.js';
import { getRecommendations } from './recommendations.js';

/**
 * Pure assessment engine function
 * Evaluates extraction and optional investigation inputs
 */
export function assess({
  extraction = {},
  investigation = null,
  userOverrides = {},
  todayIso = null,
}) {
  const flags = [];
  const referenceToday = todayIso || new Date().toISOString().slice(0, 10);

  const product = { ...(extraction.product || {}), ...(userOverrides.product || {}) };
  const dates = (extraction.dates || []).map((d, i) => {
    const override = (userOverrides.dates && userOverrides.dates[i]) || {};
    return { ...d, ...override };
  });
  const labelRules = extraction.labelRules || [];
  const damage = extraction.damage || { findings: [] };
  const imageQuality = extraction.imageQuality || [];
  const pao = { ...(extraction.pao || {}), ...(userOverrides.pao || {}) };

  // Assess Damage
  const findings = damage.findings || [];
  const severeFindings = findings.filter(
    (f) => f.severity === 'severe' || CRITICAL_DAMAGE_TYPES.has(f.type)
  );
  const moderateFindings = findings.filter(
    (f) => f.severity === 'moderate' && !CRITICAL_DAMAGE_TYPES.has(f.type)
  );
  const minorFindings = findings.filter((f) => f.severity === 'minor');

  let damageLevel = 'none';
  if (severeFindings.length > 0) {
    damageLevel = 'severe';
  } else if (moderateFindings.length > 0) {
    damageLevel = 'suspected';
  } else if (minorFindings.length > 0) {
    damageLevel = 'minor';
  }

  if (moderateFindings.length > 0 || minorFindings.length > 0) {
    for (const f of [...moderateFindings, ...minorFindings]) {
      flags.push({
        type: 'DAMAGE_FLAG',
        severity: f.severity,
        message: `Packaging note: ${f.type.replace(/_/g, ' ')} detected (${f.severity}). ${f.evidence || ''}`,
      });
    }
  }

  // Assess Image Quality Blockers
  const severeQualityIssues = imageQuality.filter(
    (q) => q.issues && ['blurry', 'dark', 'faded_print'].includes(q.issues)
  );

  // Separate Dates
  const expCandidates = dates.filter((d) =>
    ['EXP', 'BEST_BEFORE', 'USE_BY'].includes(d.kind) && d.parsed
  );
  const mfgCandidates = dates.filter((d) => d.kind === 'MFG' && d.parsed);

  const confirmedExp = expCandidates.find(
    (d) => d.confirmedByUser || (!d.parsed.ambiguous && d.agreement === 'both')
  );
  const unconfirmedOrAmbiguousExp = expCandidates.find(
    (d) => d.parsed.ambiguous || d.agreement !== 'both'
  );

  const confirmedMfg = mfgCandidates.find(
    (d) => d.confirmedByUser || (!d.parsed.ambiguous && d.agreement === 'both')
  );

  // PAO calculation if cosmetic
  let paoDiscardBy = null;
  let paoFormula = null;
  if (product.category === CATEGORIES.COSMETIC && pao.present && pao.months) {
    const openedIso = userOverrides.openedOn || (extraction.hints && extraction.hints.opened && extraction.hints.opened.openedOn);
    if (openedIso) {
      const paoRes = calculatePaoDiscardDate(openedIso, pao.months);
      if (paoRes) {
        paoDiscardBy = paoRes.iso;
        paoFormula = paoRes.formulaText;
      }
    }
  }

  let primaryStatus = null;
  let expiry = {
    iso: null,
    precision: null,
    provenance: PROVENANCE.UNKNOWN,
    basisText: null,
    formulaText: null,
    sourceIds: [],
  };
  let unknownMessage = null;

  // 1. Rule: MANUAL_INSPECTION_REQUIRED
  const isOtherWithNoDate = product.category === CATEGORIES.OTHER && !confirmedExp && !unconfirmedOrAmbiguousExp;
  const isImageBlocked = severeQualityIssues.length > 0 && dates.length === 0;
  if (product.packagingType === 'unsupported' || isOtherWithNoDate || isImageBlocked) {
    primaryStatus = PRIMARY_STATUS.MANUAL_INSPECTION_REQUIRED;
    flags.push({
      type: 'MANUAL_INSPECTION',
      message: 'Product could not be reliably verified automatically. Manual inspection is required.',
    });
  }

  // 2. Rule: DAMAGE_SUSPECTED (primary)
  else if (severeFindings.length > 0) {
    primaryStatus = PRIMARY_STATUS.DAMAGE_SUSPECTED;
    flags.push({
      type: 'SEVERE_DAMAGE',
      message: `Severe packaging damage detected: ${severeFindings.map((f) => f.type.replace(/_/g, ' ')).join(', ')}.`,
    });
  }

  // 3. Rule: Printed Expiry
  else if (confirmedExp) {
    primaryStatus = PRIMARY_STATUS.EXPIRY_VERIFIED;
    expiry = {
      iso: confirmedExp.parsed.iso,
      precision: confirmedExp.parsed.precision,
      provenance: PROVENANCE.PRINTED,
      basisText: confirmedExp.rawText,
      formulaText: null,
      sourceIds: [],
    };
  } else if (unconfirmedOrAmbiguousExp) {
    primaryStatus = PRIMARY_STATUS.VERIFICATION_REQUIRED;
    flags.push({
      type: 'AMBIGUOUS_OR_UNCONFIRMED_DATE',
      message: unconfirmedOrAmbiguousExp.parsed.ambiguous
        ? `Ambiguous printed date (${unconfirmedOrAmbiguousExp.rawText}). Please select DMY or MDY interpretation.`
        : `Printed date candidate (${unconfirmedOrAmbiguousExp.rawText}) requires your confirmation.`,
      candidates: unconfirmedOrAmbiguousExp.parsed.candidatesIfAmbiguous,
    });
  }

  // 4. Rule: Label Rule + Confirmed MFG (or opening rule + opened date)
  else if (labelRules.length > 0) {
    const mfgRule = labelRules.find((r) => r.base === 'manufacture' || r.base === 'packing');
    const openingRule = labelRules.find((r) => r.base === 'opening');
    const openedIso = userOverrides.openedOn || (extraction.hints && extraction.hints.opened && extraction.hints.opened.openedOn);

    if (mfgRule && confirmedMfg) {
      const calc = calculateExpiryFromMfg(confirmedMfg.parsed.iso, mfgRule.amount, mfgRule.unit);
      if (calc) {
        primaryStatus = PRIMARY_STATUS.EXPIRY_VERIFIED;
        expiry = {
          iso: calc.iso,
          precision: confirmedMfg.parsed.precision,
          provenance: PROVENANCE.LABEL_RULE,
          basisText: `Printed Rule: "${mfgRule.rawText}" with MFG ${confirmedMfg.rawText}`,
          formulaText: calc.formulaText,
          sourceIds: [],
        };
      }
    } else if (openingRule && openedIso) {
      const calc = calculateExpiryFromMfg(openedIso, openingRule.amount, openingRule.unit);
      if (calc) {
        primaryStatus = PRIMARY_STATUS.EXPIRY_VERIFIED;
        expiry = {
          iso: calc.iso,
          precision: 'day',
          provenance: PROVENANCE.LABEL_RULE,
          basisText: `Printed Rule: "${openingRule.rawText}" with Opened date ${openedIso}`,
          formulaText: calc.formulaText,
          sourceIds: [],
        };
      }
    } else if (mfgRule && !confirmedMfg) {
      primaryStatus = PRIMARY_STATUS.VERIFICATION_REQUIRED;
      flags.push({
        type: 'MISSING_MFG_FOR_RULE',
        message: `Label has rule ("${mfgRule.rawText}"), but manufacturing date was not confirmed. Enter MFG date to compute expiry.`,
      });
    }
  }

  // 5. Rule: Investigation Conclusion BATCH_EXPIRY
  if (!primaryStatus && investigation && investigation.conclusion) {
    const conc = investigation.conclusion;
    if (conc.type === 'BATCH_EXPIRY' && conc.iso) {
      primaryStatus = PRIMARY_STATUS.EXPIRY_VERIFIED;
      expiry = {
        iso: conc.iso,
        precision: conc.precision || 'day',
        provenance: PROVENANCE.MANUFACTURER_CONFIRMED,
        basisText: `Manufacturer confirmed batch expiry: "${conc.quote}"`,
        formulaText: null,
        sourceIds: [conc.sourceId],
      };
    }
    // 6. Rule: Investigation Conclusion SHELF_LIFE
    else if (conc.type === 'SHELF_LIFE') {
      const source = (investigation.sources || []).find((s) => s.id === conc.sourceId);
      const isMedicine = product.category === CATEGORIES.MEDICINE;
      const isEligibleMedSource = source && ['MANUFACTURER', 'REGULATOR_LABEL'].includes(source.class);

      if (isMedicine && !isEligibleMedSource) {
        primaryStatus = PRIMARY_STATUS.EXPIRY_NOT_FOUND;
        expiry.provenance = PROVENANCE.UNKNOWN;
        unknownMessage = EXACT_UNKNOWN_MESSAGE;
      } else if (confirmedMfg) {
        const calc = calculateExpiryFromMfg(confirmedMfg.parsed.iso, conc.amount, conc.unit);
        if (calc) {
          primaryStatus = PRIMARY_STATUS.ESTIMATED_VERIFIED_INPUTS;
          expiry = {
            iso: calc.iso,
            precision: confirmedMfg.parsed.precision,
            provenance: PROVENANCE.CALCULATED,
            basisText: `Verified claim from ${source ? source.title || source.domain : 'official source'}: "${conc.quote}"`,
            formulaText: calc.formulaText,
            sourceIds: [conc.sourceId],
          };
        }
      } else {
        primaryStatus = PRIMARY_STATUS.VERIFICATION_REQUIRED;
        flags.push({
          type: 'MISSING_MFG_FOR_SHELF_LIFE',
          message: `Shelf life of ${conc.amount} ${conc.unit} found from verified source, but manufacturing date is missing. Enter MFG date to calculate expiry.`,
        });
      }
    }
    // 7. Rule: Investigation CONFLICT
    else if (conc.type === 'CONFLICT') {
      primaryStatus = PRIMARY_STATUS.VERIFICATION_REQUIRED;
      flags.push({
        type: 'INVESTIGATION_CONFLICT',
        message: 'Multiple verified sources reported conflicting shelf-life values. Manual verification required.',
      });
    }
  }

  // 8. Rule: No Expiry Data
  if (!primaryStatus) {
    if (!investigation || !investigation.ran) {
      primaryStatus = PRIMARY_STATUS.EXPIRY_NOT_FOUND;
      expiry.provenance = PROVENANCE.UNKNOWN;
    } else {
      primaryStatus = PRIMARY_STATUS.EXPIRY_NOT_FOUND;
      expiry.provenance = PROVENANCE.UNKNOWN;
      unknownMessage = EXACT_UNKNOWN_MESSAGE;
    }
  }

  // Calculate Expiry State & Effective Discard By
  const expiryState = getExpiryState(expiry.iso, referenceToday);
  const effectiveDiscardBy = getEarlierDate(expiry.iso, paoDiscardBy);

  // Recommendations
  const recommendation = getRecommendations({
    category: product.category || CATEGORIES.FOOD,
    expiryState,
    hasSevereDamage: severeFindings.length > 0,
    hasModerateDamage: moderateFindings.length > 0,
    isUnknownExpiry: expiry.provenance === PROVENANCE.UNKNOWN,
    paoMonths: pao.months,
    isOpened: !!(extraction.hints && extraction.hints.opened && extraction.hints.opened.isOpened),
    storageInstructions: extraction.storageInstructions,
  });

  return {
    primaryStatus,
    expiry,
    expiryState,
    paoDiscardBy,
    paoFormula,
    effectiveDiscardBy,
    damageLevel,
    flags,
    recommendation,
    unknownMessage,
  };
}
