import { categories } from './categories.js';
import { productDescriptionHtml } from './product-description.js';

function validImageUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && value.length <= 1000; }
  catch { return false; }
}

export function parseProduct(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Data produk tidak valid.' };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = body.category;
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const galleryUrls = body.galleryUrls ?? [];
  const price = Number(body.price);
  const compareAtPrice = body.compareAtPrice === '' || body.compareAtPrice == null ? null : Number(body.compareAtPrice);
  const stock = Number(body.stock);
  const variants = body.variants ?? [];
  if (!Array.isArray(variants) || variants.length > 100) return { error: 'Daftar varian tidak valid.' };
  if (!name || name.length > 160) return { error: 'Nama produk tidak valid.' };
  if (description.length > 20000 || !categories.includes(category)) return { error: 'Deskripsi atau kategori tidak valid.' };
  const maxInteger = 2147483647;
  if (!Number.isSafeInteger(price) || price < 0 || price > maxInteger || (compareAtPrice !== null && (!Number.isSafeInteger(compareAtPrice) || compareAtPrice < price || compareAtPrice > maxInteger)) || !Number.isSafeInteger(stock) || stock < 0 || stock > maxInteger) return { error: 'Harga atau stok tidak valid.' };
  const parsedVariants = variants.map(row => ({ colorId: row?.colorId ? String(row.colorId) : null, sizeId: row?.sizeId ? String(row.sizeId) : null, price: Number(row?.price), stock: Number(row?.stock), imageUrl: typeof row?.imageUrl === 'string' ? row.imageUrl.trim() || null : null }));
  if (parsedVariants.some(row => (!row.colorId && !row.sizeId) || (row.colorId && !/^\d+$/.test(row.colorId)) || (row.sizeId && !/^\d+$/.test(row.sizeId)) || !Number.isSafeInteger(row.price) || row.price < 0 || row.price > maxInteger || !Number.isSafeInteger(row.stock) || row.stock < 0 || row.stock > maxInteger) || new Set(parsedVariants.map(row => `${row.colorId ?? ''}:${row.sizeId ?? ''}`)).size !== parsedVariants.length) return { error: 'Isi minimal satu pilihan warna atau ukuran per varian, dengan harga dan stok yang valid.' };
  if (!Array.isArray(galleryUrls) || galleryUrls.length > 3 || galleryUrls.some(url => typeof url !== 'string' || !validImageUrl(url.trim()))) return { error: 'Gambar pendamping maksimal 3 URL HTTP atau HTTPS.' };
  if (!validImageUrl(imageUrl) || parsedVariants.some(row => row.imageUrl && !validImageUrl(row.imageUrl))) return { error: 'URL gambar harus berupa alamat HTTP atau HTTPS.' };
  const badge = typeof body.badge === 'string' ? body.badge.trim().slice(0, 40) : '';
  return { data: { name, description: productDescriptionHtml(description), category, imageUrl, galleryUrls: galleryUrls.map(url => url.trim()), price, compareAtPrice: parsedVariants.length ? null : compareAtPrice, stock, variants: parsedVariants, badge: badge || null, featured: body.featured === true, newest: body.newest === true, active: body.active !== false } };
}
