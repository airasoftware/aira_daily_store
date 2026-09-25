import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../../lib/admin-auth';
import { getPool } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 }); }
  if (!['paid', 'cancelled'].includes(body?.status)) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const order = await client.query('SELECT status FROM orders WHERE id=$1 FOR UPDATE', [id]);
    if (!order.rows.length) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 }); }
    if (order.rows[0].status !== 'pending') { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Hanya pesanan menunggu yang dapat diubah.' }, { status: 409 }); }
    await client.query('UPDATE orders SET status=$1 WHERE id=$2', [body.status, id]);
    if (body.status === 'cancelled') {
      await client.query(`UPDATE product_variants v SET stock = v.stock + oi.quantity FROM order_items oi WHERE oi.order_id=$1 AND oi.variant_id=v.id`, [id]);
      await client.query(`UPDATE products p SET stock = p.stock + restored.quantity FROM
        (SELECT product_id, SUM(quantity) AS quantity FROM order_items WHERE order_id=$1 AND variant_id IS NULL GROUP BY product_id) restored
        WHERE p.id = restored.product_id AND p.has_variants = FALSE`, [id]);
      await client.query(`UPDATE products p SET stock = COALESCE((SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id=p.id AND v.is_active), 0)
        WHERE p.has_variants = TRUE AND p.id IN (SELECT product_id FROM order_items WHERE order_id=$1)`, [id]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, status: body.status });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Gagal memperbarui pesanan:', error);
    return NextResponse.json({ error: 'Status pesanan belum dapat diperbarui.' }, { status: 500 });
  } finally { client.release(); }
}
