/**
 * Client-side image processing: downscale, strip EXIF, compress
 */
export async function processImageFile(file, options = { maxDimension: 1600, maxBytes: 380 * 1024 }) {
  if (!file) throw new Error('No file provided');

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file is larger than 10 MB limit.');
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  // Downscale if exceeds maxDimension
  if (width > options.maxDimension || height > options.maxDimension) {
    if (width > height) {
      height = Math.round((height * options.maxDimension) / width);
      width = options.maxDimension;
    } else {
      width = Math.round((width * options.maxDimension) / height);
      height = options.maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Quality loop to ensure <= maxBytes
  let quality = 0.85;
  let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  while (blob && blob.size > options.maxBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  // Convert to base64
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  return {
    mimeType: 'image/jpeg',
    data: base64,
    dataUrl,
    sizeBytes: blob.size,
    width,
    height,
  };
}
