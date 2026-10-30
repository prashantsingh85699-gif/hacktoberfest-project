import { CATEGORIES, EXPIRY_STATE, DAMAGE_SEVERITY, SAFETY_DISCLAIMER, NO_PROBLEM_FOUND_MESSAGE } from './constants.js';

export function getRecommendations({
  category = CATEGORIES.FOOD,
  expiryState = EXPIRY_STATE.UNKNOWN,
  hasSevereDamage = false,
  hasModerateDamage = false,
  isUnknownExpiry = false,
  paoMonths = null,
  isOpened = false,
  storageInstructions = null,
}) {
  const details = [];
  const doNot = [];
  let headline = '';

  // 1. Severe damage overrides all
  if (hasSevereDamage) {
    headline = 'Do not use: packaging integrity compromised';
    doNot.push('Do not consume or apply this product.');
    doNot.push('Do not rely on expiry dates when packaging is broken, swollen, leaking, or severely compromised.');
    details.push('Severe packaging damage suggests microbial contamination or chemical breakdown.');
    details.push('Contact the retailer or manufacturer for a replacement or report.');
    return { headline, details, doNot, disclaimer: SAFETY_DISCLAIMER };
  }

  // 2. Category-specific logic
  if (category === CATEGORIES.MEDICINE) {
    if (expiryState === EXPIRY_STATE.EXPIRED) {
      headline = 'Expired medicine: do not use';
      doNot.push('Never consume or administer expired medication.');
      doNot.push('Do not flush down toilets or discard in standard trash without consulting local medicine disposal guidelines.');
      details.push('Expired drugs may lose chemical potency or break down into toxic subproducts.');
      details.push('Consult a licensed pharmacist or physician for a safe replacement.');
    } else if (isUnknownExpiry) {
      headline = 'Unknown expiry: do not use until verified';
      doNot.push('Do not take or administer this medication with unknown expiry.');
      details.push('Pharmaceutical safety mandates verifiable expiration dates.');
      details.push('Contact a pharmacist or the manufacturer with your batch code to verify safety.');
    } else if (expiryState === EXPIRY_STATE.EXPIRING_SOON) {
      headline = 'Expiring within 30 days';
      details.push('Verify course duration with your prescription to ensure the full treatment completes before expiry.');
      details.push('Check proper storage conditions (temperature, moisture, light protection).');
    } else {
      headline = 'Expiry verified in date';
      details.push(NO_PROBLEM_FOUND_MESSAGE);
      details.push('Store according to package instructions away from heat and moisture.');
    }
    return { headline, details, doNot, disclaimer: SAFETY_DISCLAIMER };
  }

  if (category === CATEGORIES.FOOD) {
    if (expiryState === EXPIRY_STATE.EXPIRED) {
      headline = 'Product is past expiry / best before';
      doNot.push('Do not consume foods that are past their Use By or Expiry date.');
      details.push('Risk of foodborne pathogens increases significantly past use-by dates.');
      details.push('Inspect odor, texture, and appearance carefully; discard if uncertain.');
    } else if (isUnknownExpiry) {
      headline = 'Expiry date not found on packaging';
      details.push('Check the bottom, cap, side crimp, and outer box for laser-etched or stamped dates.');
      details.push('Inspect packaging condition and odor before considering consumption.');
    } else if (expiryState === EXPIRY_STATE.EXPIRING_SOON) {
      headline = 'Expiring soon (within 30 days)';
      details.push('Plan consumption soon.');
      details.push(NO_PROBLEM_FOUND_MESSAGE);
    } else {
      headline = 'In-date product';
      details.push(NO_PROBLEM_FOUND_MESSAGE);
      details.push('Always check odor, color, and packaging seal before consumption.');
    }

    if (isOpened) {
      details.push('Product has been opened: consume promptly according to "consume within X days of opening" guidelines.');
    }
    if (storageInstructions) {
      details.push(`Storage: ${storageInstructions}`);
    }

    return { headline, details, doNot, disclaimer: SAFETY_DISCLAIMER };
  }

  if (category === CATEGORIES.COSMETIC) {
    if (expiryState === EXPIRY_STATE.EXPIRED) {
      headline = 'Cosmetic product expired: do not use';
      doNot.push('Do not apply expired cosmetics to skin, eyes, or mucous membranes.');
      details.push('Preservatives degrade over time, leading to bacterial and fungal growth.');
    } else if (isUnknownExpiry) {
      headline = 'Uncertain expiry / PAO period';
      details.push('Cosmetics without printed expiry often rely on the Period After Opening (PAO) jar symbol.');
      if (paoMonths) {
        details.push(`PAO is ${paoMonths}M: count ${paoMonths} months from the exact date you first opened it.`);
      }
    } else {
      headline = 'Cosmetic product within date';
      details.push(NO_PROBLEM_FOUND_MESSAGE);
      if (paoMonths) {
        details.push(`Remember to discard within ${paoMonths} months after opening.`);
      }
    }
    return { headline, details, doNot, disclaimer: SAFETY_DISCLAIMER };
  }

  // Default OTHER category
  headline = expiryState === EXPIRY_STATE.EXPIRED ? 'Expired product' : 'Product status assessed';
  details.push(expiryState === EXPIRY_STATE.EXPIRED ? 'Product is past its printed expiration date.' : NO_PROBLEM_FOUND_MESSAGE);
  return { headline, details, doNot, disclaimer: SAFETY_DISCLAIMER };
}
