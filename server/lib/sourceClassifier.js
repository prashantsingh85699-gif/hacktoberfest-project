import { parse } from 'tldts';

const RETAILER_DOMAINS = new Set([
  'amazon', 'flipkart', 'bigbasket', 'blinkit', 'zepto', 'jiomart', 'walmart', 'target',
  'ebay', 'aliexpress', '1mg', 'pharmeasy', 'netmeds', 'nykaa', 'meesho', 'swiggy',
  'instamart', 'zomato', 'costco', 'kroger', 'walgreens', 'cvs', 'boots', 'tesco',
]);

const COMMUNITY_DOMAINS = new Set([
  'wikipedia', 'reddit', 'quora', 'facebook', 'instagram', 'youtube', 'pinterest',
  'tiktok', 'medium', 'blogspot', 'wordpress', 'fandom', 'openfoodfacts',
  'openbeautyfacts', 'openproductsfacts', 'checkfresh', 'checkcosmetic',
  'cosmeticcalculator', 'batchdecoder', 'beautykeeper',
]);

const REGULATOR_DOMAINS = new Set([
  'dailymed.nlm.nih.gov',
  'accessdata.fda.gov',
  'fda.gov',
  'ema.europa.eu',
  'medicines.org.uk',
  'cdsco.gov.in',
  'nih.gov',
  'who.int',
]);

const RISKY_TLDS = new Set([
  'xyz', 'top', 'click', 'buzz', 'cyou', 'icu', 'loan', 'work', 'rest', 'monster', 'cfd', 'sbs',
]);

const GENERIC_STOP_WORDS = new Set([
  'ltd', 'limited', 'pvt', 'private', 'inc', 'corp', 'corporation', 'company', 'co',
  'products', 'foods', 'pharma', 'laboratories', 'labs', 'healthcare', 'health',
  'india', 'usa', 'global', 'brands', 'international', 'group', 'the', 'and', '&',
]);

function cleanTokens(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !GENERIC_STOP_WORDS.has(t));
}

/**
 * Deterministically classifies a source URL for shelf life investigation
 */
export function classifySource(urlStr, { brand = '', manufacturer = '', category = 'food' } = {}) {
  if (!urlStr) {
    return {
      class: 'OTHER',
      eligible: false,
      reason: 'Missing URL',
      domain: '',
    };
  }

  let parsed;
  try {
    parsed = parse(urlStr);
  } catch {
    return {
      class: 'OTHER',
      eligible: false,
      reason: 'Invalid URL formatting',
      domain: '',
    };
  }

  const hostname = (parsed.hostname || '').toLowerCase();
  const domain = (parsed.domain || '').toLowerCase();
  const domainWithoutSuffix = (parsed.domainWithoutSuffix || '').toLowerCase();
  const publicSuffix = (parsed.publicSuffix || '').toLowerCase();

  // 1. Regulator check
  for (const reg of REGULATOR_DOMAINS) {
    if (hostname === reg || hostname.endsWith('.' + reg)) {
      const eligible = category === 'medicine';
      return {
        class: 'REGULATOR_LABEL',
        eligible,
        reason: eligible
          ? 'Official pharmaceutical regulator monograph / prescribing information database.'
          : 'Regulator monograph (ineligible for non-medicine categories).',
        domain: hostname,
      };
    }
  }

  // 2. Retailer check
  for (const ret of RETAILER_DOMAINS) {
    if (domainWithoutSuffix === ret || domainWithoutSuffix.includes(ret)) {
      return {
        class: 'RETAILER',
        eligible: false,
        reason: 'Retailer or marketplace catalog. Third-party listings cannot establish manufacturer shelf life.',
        domain,
      };
    }
  }

  // 3. Community / Wiki check
  for (const comm of COMMUNITY_DOMAINS) {
    if (domainWithoutSuffix === comm || domainWithoutSuffix.includes(comm)) {
      return {
        class: 'COMMUNITY',
        eligible: false,
        reason: 'Crowd-sourced wiki, forum, or third-party batch decoder. Reference only.',
        domain,
      };
    }
  }

  // Check risky TLDs
  if (RISKY_TLDS.has(publicSuffix)) {
    return {
      class: 'OTHER',
      eligible: false,
      reason: 'Domain public suffix is classified as high-risk TLD.',
      domain,
    };
  }

  // 4. Manufacturer domain match
  const brandTokens = cleanTokens(brand);
  const mfgTokens = cleanTokens(manufacturer);
  const allTokens = [...new Set([...brandTokens, ...mfgTokens])];

  let matchedToken = null;
  for (const token of allTokens) {
    if (domainWithoutSuffix.includes(token)) {
      matchedToken = token;
      break;
    }
  }

  if (matchedToken) {
    return {
      class: 'MANUFACTURER',
      eligible: true,
      reason: `Domain matched manufacturer/brand identifier ("${matchedToken}").`,
      domain,
    };
  }

  return {
    class: 'OTHER',
    eligible: false,
    reason: 'Third-party or unverified domain. Open link to verify official standing.',
    domain,
  };
}

