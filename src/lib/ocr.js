import { createWorker } from 'tesseract.js';

let sharedWorker = null;

export async function getOcrWorker(onProgress) {
  if (!sharedWorker) {
    sharedWorker = await createWorker('eng', 1, {
      logger: (m) => {
        if (onProgress && typeof onProgress === 'function') {
          onProgress(m);
        }
      },
    });
  }
  return sharedWorker;
}

/**
 * Runs OCR on an image dataUrl or Blob
 */
export async function recognizePackagingText(imageSource, onProgress) {
  try {
    const worker = await getOcrWorker(onProgress);
    const result = await worker.recognize(imageSource);

    const text = result?.data?.text || '';
    const confidence = (result?.data?.confidence || 0) / 100;

    return {
      text,
      meanConfidence: confidence,
    };
  } catch (err) {
    console.warn('OCR execution failed or worker error:', err);
    return {
      text: '',
      meanConfidence: 0,
      error: err.message,
    };
  }
}
