import { getPool } from './db.js';
import { getPublicSupabase } from './supabase-public.js';
import { getProductVariants } from './variants.js';

export async function getProducts({ category, search, sort, featured, newest, homepage } = {}) {
  const supabase = getPublicSupabase();
  if (supabase) {
    let query = supabase.from('products').select('*').eq('is_active', true);
    if (category && category !== 'Semua') query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);
    if (featured) query = query.eq('is_featured', true);
    if (newest) query = query.eq('is_new', true);
    if (homepage) query = query.or('is_featured.eq.true,is_new.eq.true');
    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else query = query.order('id', { ascending: true });
    const { data, error } = await query;
    if (error) throw new Error(`Gagal membaca katalog Supabase: ${error.message}`);
    return data;
  }

  const values = [];
  const where = ['is_active = TRUE'];
  if (category && category !== 'Semua') { values.push(category); where.push(`category = $${values.length}`); }
  if (search) { values.push(`%${search}%`); where.push(`name ILIKE $${values.length}`); }
  if (featured) where.push('is_featured = TRUE');
  if (newest) where.push('is_new = TRUE');
  if (homepage) where.push('(is_featured = TRUE OR is_new = TRUE)');
  const order = sort === 'price-asc' ? 'price ASC' : sort === 'price-desc' ? 'price DESC' : 'id ASC';
  const result = await getPool().query(`SELECT * FROM products ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`, values);
  return result.rows;
}

export async function getProduct(slug) {
  const supabase = getPublicSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (error) throw new Error(`Gagal membaca produk Supabase: ${error.message}`);
    if (!data || !data.has_variants) return data;
    const [variantResult, optionResult] = await Promise.all([
      supabase.from('product_variants').select('id,color_id,size_id,price,stock,image_url').eq('product_id', data.id).eq('is_active', true),
      supabase.from('variant_options').select('id,kind,name'),
    ]);
    if (variantResult.error || optionResult.error) throw new Error('Gagal membaca varian produk Supabase.');
    const names = new Map(optionResult.data.map(option => [String(option.id), option.name]));
    return { ...data, variants: variantResult.data.map(row => ({ ...row, color: names.get(String(row.color_id)), size: names.get(String(row.size_id)) })) };
  }

  const result = await getPool().query('SELECT * FROM products WHERE slug = $1 AND is_active = TRUE', [slug]);
  const product = result.rows[0] ?? null;
  return product?.has_variants ? { ...product, variants: await getProductVariants(getPool(), product.id) } : product;
}

export function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export function discount(product) {
  return product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
}
