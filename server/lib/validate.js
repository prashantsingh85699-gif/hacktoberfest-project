import { HttpError } from './http.js';
import { parseDateString } from '../../shared/dateParse.js';
import { parseLabelRule } from '../../shared/labelRules.js';
import { validateBarcodeChecksum } from '../../shared/agreement.js';

export function checkMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 (0x89, 'P', 'N', 'G')
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // WebP: RIFF ... WEBP
  if (mimeType === 'image/webp') {
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

export function validateScanInput(body) {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'INVALID_INPUT', 'Request body must be a JSON object.');
  }

  const { images, ocr, barcodes, hints } = body;

  if (!Array.isArray(images) || images.length === 0) {
    throw new HttpError(400, 'INVALID_INPUT', 'At least one image is required (max 5).');
  }

  if (images.length > 5) {
    throw new HttpError(400, 'INVALID_INPUT', 'A maximum of 5 images per scan is permitted.');
  }

  let totalBytes = 0;
  const validatedImages = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img || !img.data || !img.mimeType) {
      throw new HttpError(400, 'INVALID_IMAGE', `Image at index ${i} is missing data or mimeType.`);
    }

    const mime = img.mimeType.toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime)) {
      throw new HttpError(400, 'INVALID_IMAGE', `Image at index ${i} has unsupported format. Use JPG, PNG, or WebP.`);
    }

    let buffer;
    try {
      buffer = Buffer.from(img.data, 'base64');
    } catch {
      throw new HttpError(400, 'INVALID_IMAGE', `Image at index ${i} has invalid base64 encoding.`);
    }

    if (buffer.length > 450 * 1024) {
      throw new HttpError(413, 'PAYLOAD_TOO_LARGE', `Image at index ${i} exceeds 450 KB limit.`);
    }

    totalBytes += buffer.length;
    if (totalBytes > 2.2 * 1024 * 1024) {
      throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Total payload size exceeds 2.2 MB limit.');
    }

    if (!checkMagicBytes(buffer, mime)) {
      throw new HttpError(400, 'INVALID_IMAGE', `Image at index ${i} magic bytes do not match declared ${mime}.`);
    }

    validatedImages.push({
      role: ['front', 'back', 'bottom', 'label', 'batch', 'other'].includes(img.role) ? img.role : 'other',
      mimeType: mime === 'image/jpg' ? 'image/jpeg' : mime,
      data: img.data,
      buffer,
    });
  }

  // Validate OCR
  const validatedOcr = [];
  if (Array.isArray(ocr)) {
    for (const item of ocr) {
      if (item && typeof item.text === 'string') {
        validatedOcr.push({
          imageIndex: typeof item.imageIndex === 'number' ? item.imageIndex : 0,
          text: item.text.slice(0, 6000),
          meanConfidence: typeof item.meanConfidence === 'number' ? Math.min(1, Math.max(0, item.meanConfidence)) : 0,
        });
      }
    }
  }

  // Validate Barcodes
  const validatedBarcodes = [];
  if (Array.isArray(barcodes)) {
    for (const b of barcodes) {
      if (b && typeof b.value === 'string') {
        const val = b.value.trim();
        if (/^\d{8,14}$/.test(val) && validateBarcodeChecksum(val)) {
          validatedBarcodes.push({
            imageIndex: b.imageIndex || 0,
            format: b.format || 'EAN-13',
            value: val,
          });
        }
      }
    }
  }

  return {
    images: validatedImages,
    ocr: validatedOcr,
    barcodes: validatedBarcodes,
    hints: hints || {},
  };
}

export function sanitizeBox2d(box) {
  if (!Array.isArray(box) || box.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = box.map(Number);
  if (isNaN(ymin) || isNaN(xmin) || isNaN(ymax) || isNaN(xmax)) return null;
  if (ymin < 0 || xmin < 0 || ymax > 1000 || xmax > 1000) return null;
  if (ymin >= ymax || xmin >= xmax) return null;
  return [ymin, xmin, ymax, xmax];
}

export function normalizeExtraction(rawJson, validatedInput) {
  const data = rawJson || {};

  // Product identity
  const rawProduct = data.product || {};
  const product = {
    category: ['food', 'medicine', 'cosmetic', 'electronics', 'other'].includes(rawProduct.category) ? rawProduct.category : 'other',
    categoryConfidence: typeof rawProduct.categoryConfidence === 'number' ? Math.min(1, Math.max(0, rawProduct.categoryConfidence)) : 0.5,
    name: String(rawProduct.name || 'Unknown Product').slice(0, 200).trim(),
    brand: String(rawProduct.brand || '').slice(0, 100).trim(),
    manufacturer: String(rawProduct.manufacturer || '').slice(0, 150).trim(),
    variant: String(rawProduct.variant || '').slice(0, 100).trim(),
    strength: String(rawProduct.strength || '').slice(0, 80).trim(),
    dosageForm: String(rawProduct.dosageForm || '').slice(0, 80).trim(),
    netQuantity: String(rawProduct.netQuantity || '').slice(0, 50).trim(),
    packagingType: String(rawProduct.packagingType || 'package').slice(0, 50).trim(),
    isNonPerishable: !!rawProduct.isNonPerishable,
    identityConfidence: typeof rawProduct.identityConfidence === 'number' ? Math.min(1, Math.max(0, rawProduct.identityConfidence)) : 0.5,
    identityEvidence: String(rawProduct.identityEvidence || '').slice(0, 300).trim(),
  };

  // Re-parse all dates deterministically in code
  const rawDates = Array.isArray(data.dates) ? data.dates.slice(0, 12) : [];
  const dates = [];

  for (const d of rawDates) {
    if (!d || typeof d.rawText !== 'string') continue;
    const rawText = d.rawText.slice(0, 80).trim();
    if (!rawText) continue;

    const kind = ['MFG', 'EXP', 'BEST_BEFORE', 'USE_BY', 'PACKED_ON', 'OTHER'].includes(d.kind) ? d.kind : 'OTHER';
    const parsed = parseDateString(rawText, { isMfg: kind === 'MFG' });

    dates.push({
      kind,
      rawText,
      imageIndex: typeof d.imageIndex === 'number' ? d.imageIndex : 0,
      modelConfidence: typeof d.modelConfidence === 'number' ? Math.min(1, Math.max(0, d.modelConfidence)) : 0.7,
      parsed,
    });
  }

  // Re-parse label rules
  const rawRules = Array.isArray(data.labelRules) ? data.labelRules.slice(0, 5) : [];
  const labelRules = [];
  for (const r of rawRules) {
    if (!r || typeof r.rawText !== 'string') continue;
    const ruleText = r.rawText.slice(0, 150).trim();
    const parsedRule = parseLabelRule(ruleText);
    if (parsedRule) {
      labelRules.push({
        ...parsedRule,
        imageIndex: typeof r.imageIndex === 'number' ? r.imageIndex : 0,
      });
    }
  }

  // Batch numbers
  const rawBatches = Array.isArray(data.batchNumbers) ? data.batchNumbers.slice(0, 6) : [];
  const batchNumbers = rawBatches.map((b) => ({
    labelText: String(b?.labelText || 'Batch').slice(0, 50),
    value: String(b?.value || '').slice(0, 50).trim(),
    imageIndex: typeof b?.imageIndex === 'number' ? b.imageIndex : 0,
    confidence: typeof b?.confidence === 'number' ? b.confidence : 0.8,
  })).filter((b) => b.value.length > 0);

  // Damage
  const rawDamage = data.damage || {};
  const damageFindings = Array.isArray(rawDamage.findings)
    ? rawDamage.findings.slice(0, 10).map((f) => ({
        type: String(f?.type || 'other').slice(0, 40),
        severity: ['minor', 'moderate', 'severe'].includes(f?.severity) ? f.severity : 'minor',
        evidence: String(f?.evidence || '').slice(0, 200),
        imageIndex: typeof f?.imageIndex === 'number' ? f.imageIndex : 0,
        box2d: sanitizeBox2d(f?.box2d || f?.box_2d),
        confidence: typeof f?.confidence === 'number' ? f.confidence : 0.7,
      }))
    : [];

  const damage = {
    assessed: !!rawDamage.assessed,
    findings: damageFindings,
    limitations: String(rawDamage.limitations || 'Contents cannot be judged from packaging photos alone.').slice(0, 250),
  };

  // PAO
  const rawPao = data.pao || {};
  const pao = {
    present: !!rawPao.present,
    months: typeof rawPao.months === 'number' ? rawPao.months : null,
    rawText: String(rawPao.rawText || '').slice(0, 20),
  };

  // Image quality
  const imageQuality = Array.isArray(data.imageQuality)
    ? data.imageQuality.map((q) => ({
        issues: String(q?.issues || '').slice(0, 50),
        note: String(q?.note || '').slice(0, 150),
      }))
    : [];

  return {
    product,
    dates,
    labelRules,
    batchNumbers,
    barcodes: validatedInput.barcodes || [],
    pao,
    storageInstructions: String(data.storageInstructions || '').slice(0, 200),
    customerContact: {
      phone: String(data.customerContact?.phone || '').slice(0, 40),
      email: String(data.customerContact?.email || '').slice(0, 60),
      website: String(data.customerContact?.website || '').slice(0, 100),
    },
    damage,
    imageQuality,
    ocr: validatedInput.ocr || [],
  };
}

