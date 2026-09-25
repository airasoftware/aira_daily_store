export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;
export const PRODUCT_IMAGE_BUCKET = 'product-images';

const formats = {
  'image/jpeg': { extension: 'jpg', matches: bytes => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  'image/png': { extension: 'png', matches: bytes => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { extension: 'webp', matches: bytes => bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
};

export function inspectProductImage(bytes, mimeType) {
  if (!bytes.length || bytes.length > MAX_PRODUCT_IMAGE_BYTES) return { error: 'Gambar harus berukuran maksimal 4 MB.' };
  const format = formats[mimeType];
  if (!format || !format.matches(bytes)) return { error: 'Gunakan gambar JPG, PNG, atau WebP yang valid.' };
  return { extension: format.extension };
}
