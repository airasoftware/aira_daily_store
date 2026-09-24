import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../lib/admin-auth';
import { parseProduct } from '../../../../lib/admin-validation';
import { getPool } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data produk tidak valid.' }, { status: 400 }); }
  const parsed = parseProduct(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const p = parsed.data;
  try {
    const result = await getPool().query(`INSERT INTO products (slug, name, description, category, price, compare_at_price, image_url, badge, stock, is_featured, is_new, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, [p.slug, p.name, p.description, p.category, p.price, p.compareAtPrice, p.imageUrl, p.badge, p.stock, p.featured, p.newest, p.active]);
    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Slug sudah dipakai produk lain.' }, { status: 409 });
    console.error('Gagal membuat produk:', error);
    return NextResponse.json({ error: 'Produk belum dapat disimpan.' }, { status: 500 });
  }
}
