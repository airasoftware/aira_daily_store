import { categories } from './categories.js';

export function parseProduct(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Data produk tidak valid.' };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = body.category;
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const price = Number(body.price);
  const compareAtPrice = body.compareAtPrice === '' || body.compareAtPrice == null ? null : Number(body.compareAtPrice);
  const stock = Number(body.stock);
  if (!name || name.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) return { error: 'Nama atau slug produk tidak valid.' };
  if (description.length > 2000 || !categories.includes(category)) return { error: 'Deskripsi atau kategori tidak valid.' };
  const maxInteger = 2147483647;
  if (!Number.isSafeInteger(price) || price < 0 || price > maxInteger || (compareAtPrice !== null && (!Number.isSafeInteger(compareAtPrice) || compareAtPrice < price || compareAtPrice > maxInteger)) || !Number.isSafeInteger(stock) || stock < 0 || stock > maxInteger) return { error: 'Harga atau stok tidak valid.' };
  try { const url = new URL(imageUrl); if (!['http:', 'https:'].includes(url.protocol) || imageUrl.length > 1000) throw new Error(); } catch { return { error: 'URL gambar harus berupa alamat HTTP atau HTTPS.' }; }
  const badge = typeof body.badge === 'string' ? body.badge.trim().slice(0, 40) : '';
  return { data: { name, slug, description, category, imageUrl, price, compareAtPrice, stock, badge: badge || null, featured: body.featured === true, newest: body.newest === true, active: body.active !== false } };
}
