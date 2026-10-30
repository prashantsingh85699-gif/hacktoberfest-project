import { readBarcodesFromImageData } from 'zxing-wasm';
import { validateBarcodeChecksum } from '../../shared/agreement.js';

export async function detectBarcodesFromCanvas(canvas) {
  if (!canvas) return [];
  const results = [];

  // Try native BarcodeDetector first
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      const detector = new window.BarcodeDetector({
        formats: formats.filter((f) => ['ean_13', 'ean_8', 'upc_a', 'upc_e'].includes(f)),
      });
      const detected = await detector.detect(canvas);
      for (const item of detected) {
        const val = item.rawValue ? item.rawValue.trim() : '';
        if (/^\d{8,14}$/.test(val) && validateBarcodeChecksum(val)) {
          results.push({
            format: item.format,
            value: val,
          });
        }
      }
      if (results.length > 0) return results;
    } catch (e) {
      // Fallback to zxing-wasm
    }
  }

  // Fallback to zxing-wasm
  try {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const zxingResults = await readBarcodesFromImageData(imageData, {
      formats: ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E'],
      tryHarder: true,
      tryRotate: true,
    });

    for (const item of zxingResults) {
      const val = item.text ? item.text.trim() : '';
      if (/^\d{8,14}$/.test(val) && validateBarcodeChecksum(val)) {
        results.push({
          format: item.format,
          value: val,
        });
      }
    }
  } catch (err) {
    console.warn('Barcode detection error:', err);
  }

  return results;
}
