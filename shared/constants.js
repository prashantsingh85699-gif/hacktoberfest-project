export const PROVENANCE = {
  PRINTED: 'PRINTED',
  LABEL_RULE: 'LABEL_RULE',
  MANUFACTURER_CONFIRMED: 'MANUFACTURER_CONFIRMED',
  CALCULATED: 'CALCULATED',
  UNKNOWN: 'UNKNOWN',
};

export const PRIMARY_STATUS = {
  EXPIRY_VERIFIED: 'EXPIRY_VERIFIED',
  ESTIMATED_VERIFIED_INPUTS: 'ESTIMATED_VERIFIED_INPUTS',
  EXPIRY_NOT_FOUND: 'EXPIRY_NOT_FOUND',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  DAMAGE_SUSPECTED: 'DAMAGE_SUSPECTED',
  MANUAL_INSPECTION_REQUIRED: 'MANUAL_INSPECTION_REQUIRED',
};

export const STATUS_CONFIG = {
  [PRIMARY_STATUS.EXPIRY_VERIFIED]: {
    label: 'Expiry verified',
    color: 'green',
    meaning: 'Valid printed or confirmed expiry date verified from packaging or manufacturer.',
  },
  [PRIMARY_STATUS.ESTIMATED_VERIFIED_INPUTS]: {
    label: 'Estimated expiry (verified inputs)',
    color: 'blue',
    meaning: 'Expiry calculated using verified manufacturing date and verified manufacturer shelf-life claim.',
  },
  [PRIMARY_STATUS.EXPIRY_NOT_FOUND]: {
    label: 'Expiry not found',
    color: 'slate',
    meaning: 'No printed date or verified manufacturer shelf-life could be reliably determined.',
  },
  [PRIMARY_STATUS.VERIFICATION_REQUIRED]: {
    label: 'Verification required',
    color: 'amber',
    meaning: 'Ambiguous date, conflicting reads, or missing inputs require your confirmation.',
  },
  [PRIMARY_STATUS.DAMAGE_SUSPECTED]: {
    label: 'Packaging damage suspected',
    color: 'red',
    meaning: 'Visible packaging defect detected that may compromise product integrity.',
  },
  [PRIMARY_STATUS.MANUAL_INSPECTION_REQUIRED]: {
    label: 'Manual inspection required',
    color: 'violet',
    meaning: 'Image quality or packaging type prevents automated verification.',
  },
};

export const EXPIRY_STATE = {
  IN_DATE: 'in_date',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  UNKNOWN: 'unknown',
};

export const DAMAGE_SEVERITY = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  SEVERE: 'severe',
};

export const DAMAGE_TYPES = [
  'torn_packaging',
  'leakage',
  'swollen_container',
  'rust',
  'dent',
  'broken_seal',
  'opened_packaging',
  'visible_contamination',
  'damaged_label',
  'other',
];

export const CRITICAL_DAMAGE_TYPES = new Set([
  'leakage',
  'swollen_container',
  'visible_contamination',
  'broken_seal',
]);

export const CATEGORIES = {
  FOOD: 'food',
  MEDICINE: 'medicine',
  COSMETIC: 'cosmetic',
  OTHER: 'other',
};

export const DATE_KINDS = {
  MFG: 'MFG',
  EXP: 'EXP',
  BEST_BEFORE: 'BEST_BEFORE',
  USE_BY: 'USE_BY',
  PACKED_ON: 'PACKED_ON',
  OTHER: 'OTHER',
};

export const SOURCE_CLASSES = {
  MANUFACTURER: 'MANUFACTURER',
  REGULATOR_LABEL: 'REGULATOR_LABEL',
  RETAILER: 'RETAILER',
  COMMUNITY: 'COMMUNITY',
  OTHER: 'OTHER',
};

export const EXACT_UNKNOWN_MESSAGE =
  'Expiry could not be reliably determined. Please contact the manufacturer or pharmacist.';

export const SAFETY_DISCLAIMER =
  'ExpiryWatch AI is an assistive tool, not a medical device or food-safety certification.';

export const NO_PROBLEM_FOUND_MESSAGE =
  'No expiry problem found on the printed date. This does not guarantee safety.';
