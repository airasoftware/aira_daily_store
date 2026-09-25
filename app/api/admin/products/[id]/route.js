import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../../lib/admin-auth';
import { parseProduct } from '../../../../../lib/admin-validation';
import { getPool } from '../../../../../lib/db';
import { saveProductVariants } from '../../../../../lib/variants';

export const runtime = 'nodejs';

function validId(id) { return /^\d+$/.test(id); }

export async function PUT(request, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data produk tidak valid.' }, { status: 400 }); }
  const parsed = parseProduct(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const p = parsed.data;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(`UPDATE products SET slug=$1, name=$2, description=$3, category=$4, price=$5, compare_at_price=$6, image_url=$7, badge=$8, stock=$9, is_featured=$10, is_new=$11, is_active=$12, has_variants=FALSE
      WHERE id=$13 RETURNING id`, [p.slug, p.name, p.description, p.category, p.price, p.compareAtPrice, p.imageUrl, p.badge, p.stock, p.featured, p.newest, p.active, id]);
    if (!result.rows.length) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 }); }
    await saveProductVariants(client, id, p.variants);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.message === 'INVALID_VARIANTS') return NextResponse.json({ error: 'Pilihan warna atau ukuran tidak valid.' }, { status: 400 });
    if (error.code === '23505') return NextResponse.json({ error: 'Slug sudah dipakai produk lain.' }, { status: 409 });
    console.error('Gagal memperbarui produk:', error);
    return NextResponse.json({ error: 'Produk belum dapat diperbarui.' }, { status: 500 });
  } finally { client.release(); }
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
  const result = await getPool().query('UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
